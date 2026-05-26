# Server Sync Pattern

서버 ↔ 로컬 캐시 동기화를 위한 표준 패턴. 다중 디바이스에서 동일 사용자가 같은 데이터를 보면서 오프라인/네트워크 실패에도 강해야 하는 메뉴바 앱 환경을 전제로 한다.

본 doc은 **Workday API**(`/api/v1/workdays/{date}`) 구현을 예시로 들지만, 패턴 자체는 `Payroll`, `WorkPolicy`, `Profile` 등 다른 엔드포인트에도 그대로 적용한다.

## Why Server-trusted + Dirty Flag?

동기화 패턴은 보통 네 가지 후보를 검토한다.

| 패턴                                        | 오프라인 | 다중기기 충돌      | 구현 복잡도 | 이 앱에서                                   |
| ------------------------------------------- | -------- | ------------------ | ----------- | ------------------------------------------- |
| A. Server-first (매 액션마다 동기 호출)     | ❌       | 충돌 없음          | 낮음        | 메뉴바에 부적합 — 네트워크 지연이 UX를 망침 |
| B. Local-first + LWW (`updatedAt` 비교)     | ✅       | 마지막 쓰기가 이김 | 중          | 후보였으나 `updatedAt` 부재로 불가          |
| C. Local-first + CAS (`If-Match`/`version`) | ✅       | 명시적 충돌 감지   | 높음        | 서버 스키마 확장 필요                       |
| D. CRDT/OT                                  | ✅       | 자동 머지          | 매우 높음   | 오버킬                                      |

채택: **Server-trusted + Dirty Flag** (B의 단순화 변형).

**근거:**

1. **`updatedAt` 부재** — 서버 OpenAPI(`/v3/api-docs`)의 모든 응답 스키마에 timestamp 필드가 없다. 시간 비교 기반 LWW는 애초에 불가능.
2. **동시 편집 빈도 낮음** — 한 사용자가 모바일·맥에서 동시에 같은 날짜를 편집할 확률이 매우 낮다. CAS의 명시적 충돌 UX까지 갈 필요 없음.
3. **하루 단위 도큐먼트가 작고 독립적** — 5월 23일 레코드와 5월 24일 레코드가 상호 영향 없음. CRDT 같은 정밀 머지 불필요.

결과적으로 **서버를 항상 진실로 신뢰**하되, **오프라인 중 발생한 로컬 변경만 dirty 플래그로 보호**하는 단순 모델이 도메인에 충분하다.

## Architecture

```text
프론트 액션
  ↓
[1] 로컬 cache 즉시 update + is_dirty=true (낙관적)
  ↓
[2] notify_workday_changed (ticker 즉시 반영)
  ↓
[3] 백그라운드 서버 PUT/PATCH
       ├─ 성공 → 응답으로 cache 갱신 + is_dirty=false
       ├─ 4xx → 토스트 + 로컬 롤백 (서버 GET으로 복원)
       └─ 5xx/네트워크 실패 → retry queue 적재
```

5분 폴링은 별도 흐름:

```text
sync_from_server (5분마다)
  ├─ flush_sync_queue() — 큐에 적재된 변경 재전송
  └─ fetch_workday(today) — 서버 응답으로 hydrate
        ├─ is_dirty=true → 무시 (큐 flush가 처리할 때까지 보존)
        └─ is_dirty=false → 서버 응답으로 덮어쓰기
```

분기가 두 줄로 단순화됨. 시간 비교 없음.

## Data Model

### Cache Schema

```rust
// src-tauri/src/types.rs
#[derive(Serialize, Deserialize, Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkdayCache {
    pub date: String,                       // YYYY-MM-DD
    pub kind: WorkdayKind,
    pub clock_in_time: Option<String>,      // HH:MM
    pub clock_out_time: Option<String>,
    pub completed: bool,                    // 서버 status=COMPLETED 미러
    pub events: Vec<WorkdayEvent>,
    pub is_dirty: bool,                     // true=서버 미동기 (큐 적재 상태)
}

#[derive(Serialize, Deserialize, Type, Clone, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum WorkdayKind { Work, AnnualLeave, DayOff, PublicHoliday }

#[derive(Serialize, Deserialize, Type, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WorkdayEvent { Payday, PublicHoliday }
```

캐시는 `recovery/workday/{date}.json` 단일 파일로 저장. 기존 `today-work-status.json` + `today-work-schedule.json` 두 파일은 첫 부팅 시 1회 통합된다 (Migration 섹션 참고).

### Server ↔ Cache Mapping (양방향)

서버 → 캐시 (GET 응답 해석):

| 서버 `WorkdayResponse`          | `WorkdayCache`                    | 의미                           |
| ------------------------------- | --------------------------------- | ------------------------------ |
| `type: WORK` + clockIn/Out      | `kind: work`                      | 정상 근무                      |
| `type: VACATION`                | `kind: annual-leave`              | 연차 (명시적 휴무)             |
| `type: NONE`                    | `kind: day-off`                   | 일반 휴무 (record 부재와 동등) |
| `events: [PUBLIC_HOLIDAY]` 포함 | `kind: public-holiday` 오버라이드 | events가 type보다 우선         |
| `status: COMPLETED`             | `completed: true`                 | 완료 ack                       |
| `events: [PAYDAY]`              | `events`에 그대로 보관            | UI 표시용 (ticker 무관)        |

**`kind` 결정 순서**: `events`에 `PUBLIC_HOLIDAY` 있으면 → `public-holiday`. 아니면 `type`으로 매핑.

캐시 → 서버 (PUT/PATCH body):

| 클라 액션                      | HTTP / 엔드포인트               | Body                                                    |
| ------------------------------ | ------------------------------- | ------------------------------------------------------- |
| 휴무 설정 (연차)               | `PUT /api/v1/workdays/{date}`   | `{ type: "VACATION" }`                                  |
| 휴무 설정 (일반)               | `PUT /api/v1/workdays/{date}`   | `{ type: "NONE" }`                                      |
| 휴무 해제 → 정상 근무          | `PUT /api/v1/workdays/{date}`   | `{ type: "WORK", clockInTime, clockOutTime }`           |
| 임시 근무시간 (시작/종료 동시) | `PUT /api/v1/workdays/{date}`   | `{ type: "WORK", clockInTime, clockOutTime }`           |
| 퇴근시간만 조정 (조퇴/연장)    | `PATCH /api/v1/workdays/{date}` | `{ clockOutTime }`                                      |
| 완료 ack                       | `PUT /api/v1/workdays/{date}`   | 전체 상태 — 서버가 시간 비교로 `status: COMPLETED` 추론 |
| 일자 데이터 조회               | `GET /api/v1/workdays/{date}`   | —                                                       |

OpenAPI는 "전체 upsert(PUT)"와 "퇴근 시간만 수정(PATCH)"을 의도적으로 분리한다. 클라 액션도 같은 결로 매핑한다.

## Read Sync

진입점은 다음 네 곳:

1. 앱 시작 (인증 복원 직후)
2. 5분 폴링 (`SYNC_INTERVAL_SECS`)
3. 날짜 변경 감지 (자정 넘김)
4. 윈도우 포커스 복귀

모두 동일한 `fetch_workday(today)` 함수를 호출한다.

```rust
// src-tauri/src/commands/workday.rs
pub async fn fetch_workday(app: &AppHandle, date: &str) -> Result<(), String> {
    let token = match auth::get_access_token(app) {
        Some(t) => t,
        None => return Ok(()), // 비로그인 시 skip
    };

    let response = api.get_workday(&token, date).await?;
    let server_cache = WorkdayCache::from_response(date, response);

    let local = load_workday_cache(app, date).ok();

    let should_overwrite = match local {
        Some(c) if c.is_dirty => false,  // 로컬 변경 우선 보호
        _ => true,                        // clean이거나 cache 부재 → 서버 신뢰
    };

    if should_overwrite {
        save_workday_cache(app, &server_cache)?;
        salary::notify_workday_changed();
    }
    Ok(())
}
```

분기가 두 줄로 끝난다. 시간 비교 없음.

## Write Sync

```rust
pub async fn mutate_workday(
    app: AppHandle,
    date: String,
    kind: WorkdayKind,
    clock_in_time: Option<String>,
    clock_out_time: Option<String>,
    completed: bool,
) -> Result<(), String> {
    // 1. 로컬 즉시 update (낙관적)
    let mut cache = WorkdayCache {
        date: date.clone(),
        kind,
        clock_in_time: clock_in_time.clone(),
        clock_out_time: clock_out_time.clone(),
        completed,
        events: load_workday_cache(&app, &date)
            .map(|c| c.events).unwrap_or_default(),
        is_dirty: true,  // ← 핵심
    };
    save_workday_cache(&app, &cache)?;
    salary::notify_workday_changed();

    // 2. 서버 PUT (백그라운드)
    let token = match auth::get_access_token(&app) {
        Some(t) => t,
        None => {
            enqueue_sync_failure(&app, &cache, "no-token")?;
            return Ok(());
        }
    };

    match api.put_workday(&token, &date, &cache.to_upsert()).await {
        Ok(response) => {
            cache = WorkdayCache::from_response(&date, response);
            cache.is_dirty = false;
            save_workday_cache(&app, &cache)?;
        }
        Err(ApiError::Server { status, .. }) if (400..500).contains(&status) => {
            // 4xx — 토스트 + 로컬 롤백 (서버 GET으로 복원)
            rollback_via_get(&app, &date).await?;
        }
        Err(_) => {
            // 5xx/네트워크 실패 — 큐 적재 (is_dirty 유지)
            enqueue_sync_failure(&app, &cache, "network")?;
        }
    }
    Ok(())
}
```

**핵심 불변식**: `is_dirty=true`인 캐시는 서버 PUT 성공 또는 명시적 롤백 전까지 절대 폴링에 의해 덮어쓰이지 않는다.

### Retry Queue

위치: `recovery/sync-queue.json`

```json
[
  {
    "id": "uuid",
    "kind": "put-workday",
    "date": "2026-05-25",
    "payload": { "type": "VACATION" },
    "attempts": 2,
    "lastError": "timeout"
  }
]
```

트리거: 5분 폴링 진입 시 `flush_sync_queue()` 우선 호출 → 성공한 항목 제거 + 해당 캐시 `is_dirty=false` 갱신.

PUT/PATCH 모두 멱등 → 재시도 안전. 최대 5회 시도 후 사용자 알림.

## Conflict Policy

**서버 우선 (Server-trusted), 마지막 PUT 승.**

동시 편집 시나리오:

```text
T1: 맥 오프라인에서 type=VACATION으로 토글 (is_dirty=true, 큐 적재)
T2: 모바일에서 같은 날짜 type=WORK으로 변경 (서버 반영)
T3: 맥 네트워크 복귀 → 큐 flush → PUT type=VACATION → 서버 덮어쓰기
결과: 마지막 PUT(맥)이 이김. 모바일 변경 손실.
```

도메인 특성상 이 시나리오 자체가 드물어 받아들임. 충돌 토스트는 후속 PR로 보류 — 발생 빈도 데이터 확보 후 결정.

로컬 dirty 상태에서 폴링이 오면 서버 응답을 무시한다. 큐 flush 후 다음 폴링부터 정상화.

## Unauthenticated Behavior

토큰이 없으면 서버 호출 자체를 시도하지 않는다. `sync_from_server`의 기존 패턴(`auth.rs:762-765`)을 그대로 따른다.

| 시나리오                           | 동작                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| 폴링 사이클 진입 시 토큰 없음      | `flush_sync_queue()` + `fetch_workday()` 모두 skip — 서버 호출 0건                                  |
| `mutate_workday` 호출 시 토큰 없음 | 로컬 cache만 write + `is_dirty=true` + 큐 적재. PUT은 시도 안 함                                    |
| 401 응답으로 토큰 clear (만료)     | 진행 중인 sync 중단 + `clear_auth_token()` 호출. **큐는 보존** — 재로그인 후 자동 재시도            |
| 로그인 직후                        | `sync_after_login`이 즉시 hydrate. `fetch_workday(today)` 같이 호출                                 |
| 명시적 로그아웃                    | 큐 클리어 — 다른 사용자가 같은 디바이스에 로그인했을 때 이전 사용자의 미동기 액션이 전송되지 않도록 |

비로그인이면 ticker는 로컬 파일만 계속 read (현재 동작과 동일). 동기화 자체가 비활성화되므로 다중 디바이스 시나리오는 의미 없음 — 단일 로컬 상태로만 작동.

## Migration

기존 두 파일을 새 단일 파일로 1회 변환한다.

```text
recovery/today-work-status.json      ─┐
                                       ├─→ recovery/workday/{date}.json
recovery/today-work-schedule.json    ─┘
```

위치: `src-tauri/src/commands/migration.rs` (신규).

```rust
pub fn migrate_workday_cache(app: &AppHandle) -> Result<(), String> {
    let recovery_dir = get_recovery_dir(app);
    let status_path = recovery_dir.join("today-work-status.json");
    let schedule_path = recovery_dir.join("today-work-schedule.json");

    if !status_path.exists() && !schedule_path.exists() {
        return Ok(()); // 이미 마이그레이션됨 또는 신규 사용자
    }

    let (date, kind, completed) = read_legacy_status(&status_path)?;
    let (clock_in, clock_out) = read_legacy_schedule(&schedule_path)?;

    let cache = WorkdayCache {
        date,
        kind,
        clock_in_time: clock_in,
        clock_out_time: clock_out,
        completed,
        events: vec![],
        is_dirty: true,  // 서버 동기 필요 → 다음 폴링이 PUT
    };
    save_workday_cache(app, &cache)?;

    // 구 파일 삭제 (실패해도 진행)
    let _ = std::fs::remove_file(&status_path);
    let _ = std::fs::remove_file(&schedule_path);

    Ok(())
}
```

호출 시점: `lib.rs::setup` 안에서 인증 복원 전. 멱등하므로 매 부팅마다 호출해도 안전 (구 파일이 없으면 no-op).

`is_dirty=true`로 시작하는 이유: 마이그레이션된 로컬 상태가 서버보다 새로울 수 있으므로 다음 폴링에서 PUT으로 서버에 반영.

## 다른 엔드포인트에 적용하려면

다음 단계를 따른다.

### 1단계: 캐시 스키마 정의

엔드포인트별 `*Cache` 타입에 항상 `is_dirty: bool` 포함.

```rust
pub struct ProfileCache {
    pub nickname: String,
    pub email: String,
    pub is_dirty: bool,
}
```

### 2단계: 매핑 함수 작성

서버 응답 ↔ 캐시 양방향 매핑. 모든 enum/optional 필드를 빠짐없이 다루기.

### 3단계: 통합 위치

- `commands/auth.rs::sync_from_server`에 `fetch_{resource}()` 추가
- 5분 폴링이 자동으로 호출
- 로컬 액션은 `mutate_{resource}` 패턴으로 작성 (낙관적 + 백그라운드 PUT + 큐 적재)

### 4단계: 캐시 파일

`recovery/{resource}/{key}.json` 또는 단일 키면 `recovery/{resource}.json`. 큐는 공용 `recovery/sync-queue.json`에 합류.

### 적용이 부적절한 경우

- **연속 수정이 빈번한 데이터** (예: 실시간 협업 문서) — CRDT나 WebSocket 기반 push 모델로
- **트랜잭션 일관성이 필요한 다중 리소스 동기 작업** — server-first 패턴 권장
- **민감 데이터 (결제 등)** — 낙관적 update 금지, 항상 서버 확인 후 반영

## Decision Log

| 결정                  | 선택                                        | 근거                                                           |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| 동기화 모델           | Server-trusted + dirty flag                 | OpenAPI에 `updatedAt` 없음 → LWW 불가능. 가장 단순한 안전 모델 |
| 충돌 UX               | 토스트 없음, 마지막 PUT 승                  | 동시 편집 빈도 낮음 — 데이터 확보 후 후속 PR 재검토            |
| 완료 ack 위치         | 서버 공유 (`completed: bool` 동기화)        | OpenAPI `status: COMPLETED` 정의됨                             |
| 휴무 종류 매핑        | `VACATION ↔ annual-leave`, `NONE ↔ day-off` | 서버 type enum에 `NONE`이 이미 존재 — 백엔드 협의 불필요       |
| PATCH 경로            | `/api/v1/workdays/{date}` 단일 경로         | OpenAPI 실측 — `/clockOutTime` 서브경로 없음                   |
| 캐시 파일 구조        | `recovery/workday/{date}.json` 단일 파일    | status/schedule 분리 이유 부재                                 |
| Retry queue 위치      | `recovery/sync-queue.json`                  | 임시성 의미 부합, 기존 7일 cleanup 정책 재사용                 |
| Ticker 직접 서버 호출 | 금지 — 항상 로컬 파일 read                  | 메뉴바 1초 루프에 네트워크 의존성 추가 시 UX 저하              |

## Debugging

### 로그 활성화

```bash
RUST_LOG=debug bun dev:app
```

주요 로그 이벤트:

```text
[DEBUG] sync_from_server 시작
[DEBUG] flush_sync_queue: 큐 항목 2개 처리 중
[DEBUG] fetch_workday(2026-05-25): 서버 → 캐시 hydrate
[INFO]  fetch_workday: is_dirty=true 캐시 발견 — 서버 응답 무시
[WARN]  put_workday 실패 (network) — 큐 적재
[INFO]  토큰 없음 — sync skip
```

### 상태 확인

```bash
# 현재 캐시 상태
cat "~/Library/Application Support/com.myapp.app/recovery/workday/$(date +%Y-%m-%d).json"

# 큐 잔여 항목
cat "~/Library/Application Support/com.myapp.app/recovery/sync-queue.json"
```

### 자주 발생하는 증상

| 증상                                       | 원인                            | 해결                                                 |
| ------------------------------------------ | ------------------------------- | ---------------------------------------------------- |
| 다른 디바이스 변경이 5분 후에도 반영 안 됨 | 로컬 `is_dirty=true`로 보호 중  | 큐 flush 여부 확인 → 네트워크 또는 서버 오류         |
| 휴무 토글이 다른 디바이스에서 사라짐       | 마지막 PUT 승 정책으로 덮어쓰임 | 사용자에게 동시 편집 가이드 (또는 후속 PR로 충돌 UX) |
| Ticker가 변경 즉시 반영 안 됨              | `notify_workday_changed()` 누락 | 액션 핸들러에서 호출 확인                            |
| 마이그레이션이 무한 반복                   | 구 파일 삭제 실패               | 디스크 권한 확인 + 로그 검토                         |

## See Also

- [`patterns/tauri.md`](./tauri.md) — Tauri command 및 이벤트 패턴
- [`advanced/data-persistence.md`](../advanced/data-persistence.md) — 저장소 선택 가이드, 원자적 write 패턴
- 코드 진입점: `src-tauri/src/commands/workday.rs`, `src/hooks/use-workday.ts`
