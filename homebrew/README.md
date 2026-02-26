# Homebrew Cask 배포

Moa 앱의 Homebrew Cask formula 템플릿. CI가 릴리즈 시 자동으로 [nexters/homebrew-moa](https://github.com/Nexters/homebrew-moa) tap 레포에 반영한다.

## 사용자 설치

```sh
brew install --cask nexters/moa/moa

# or
brew tap nexters/moa
brew install --cask moa
```

## 구조

```
homebrew/
└── Casks/
    └── moa.rb.template   # formula 템플릿 (플레이스홀더 포함)
```

### 플레이스홀더

| 플레이스홀더      | 치환 값                    |
| ----------------- | -------------------------- |
| `{{VERSION}}`     | 릴리즈 버전 (e.g. `0.5.0`) |
| `{{SHA_AARCH64}}` | Apple Silicon DMG SHA256   |
| `{{SHA_X64}}`     | Intel DMG SHA256           |

`{{}}` 형식을 사용하여 shell 변수(`$VAR`)와 Ruby 문자열 보간(`#{version}`)과의 충돌을 방지한다.

## CI 흐름

```
release:published 이벤트
    │
    ├─ DMG 다운로드 (aarch64, x64)
    ├─ SHA256 계산
    ├─ 템플릿 sed 치환 → moa.rb 생성
    └─ nexters/homebrew-moa 에 push
```

워크플로우: [`.github/workflows/deploy-app.yml`](../.github/workflows/deploy-app.yml)

## Formula 수정

`Casks/moa.rb.template`을 직접 편집하면 된다. 다음 릴리즈 시 CI가 자동 반영.

예시: zap 경로 추가, description 변경 등.

## 외부 레포 설정 (최초 1회)

1. [nexters/homebrew-moa](https://github.com/Nexters/homebrew-moa) 레포 생성 (빈 레포 OK — 첫 릴리즈 시 CI가 자동 생성)
2. `nexters/moa` 레포에 `HOMEBREW_TAP_TOKEN` secret 추가
   - Fine-grained PAT → Repository access: `nexters/homebrew-moa` only
   - Permissions: Contents Read & Write
