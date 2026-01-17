# Task 6: 설정 화면 UI

## 목표

메뉴바 패널 내에서 전환되는 설정 화면을 구현한다. 패널 크기를 유지하면서 슬라이드 전환한다.

## 스펙 참조

- [MVP 스펙](../mvp-spec.md)

## UI 구성

### 설정 패널 (패널 내 전환)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ← 뒤로                            설정     │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │  닉네임                                     │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ 성실한 뚱이                    [저장] │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  회사명                                     │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ 집게리아                       [저장] │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  월 실수령액                                │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ 3,000,000                 원  [저장] │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  월급날                                     │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ 25일                    ▼     [저장] │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 설정 항목

| 항목        | 타입        | 설명                    |
| ----------- | ----------- | ----------------------- |
| 닉네임      | 텍스트 입력 | 랜덤 생성된 값 변경     |
| 회사명      | 텍스트 입력 | 랜덤 생성된 값 변경     |
| 월 실수령액 | 숫자 입력   | 급여 금액 변경          |
| 월급날      | 드롭다운    | 1~31일 선택 (기본 25일) |

## 구현 내용

### 1. 설정 패널 컨테이너 (`src/features/settings/settings-panel.tsx`)

```typescript
import { useUserSettings } from '~/hooks/use-user-settings';
import { SettingsHeader } from './settings-header';
import { SettingsForm } from './settings-form';

export function SettingsPanel() {
  const { data: settings, isLoading } = useUserSettings();

  if (isLoading || !settings) {
    return (
      <div className="flex w-80 items-center justify-center p-8">
        로딩중...
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col rounded-xl bg-panel shadow-lg">
      <SettingsHeader />
      <SettingsForm settings={settings} />
    </div>
  );
}
```

### 2. 설정 헤더 (`src/features/settings/settings-header.tsx`)

```typescript
import { useUIStore } from '~/stores/ui-store';

export function SettingsHeader() {
  const setShowSettings = useUIStore((s) => s.setShowSettings);

  return (
    <div className="flex items-center justify-between border-b border-divider p-4">
      <button
        onClick={() => setShowSettings(false)}
        className="flex items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
      >
        ← 뒤로
      </button>
      <h1 className="font-medium">설정</h1>
      <div className="w-12" /> {/* 균형을 위한 빈 공간 */}
    </div>
  );
}
```

### 3. 설정 폼 (`src/features/settings/settings-form.tsx`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commands } from '~/lib/tauri-bindings';
import type { UserSettings } from '~/lib/tauri-bindings';
import { SettingField } from './setting-field';
import { TextInput } from './inputs/text-input';
import { SalaryInput } from './inputs/salary-input';
import { PayDaySelect } from './inputs/pay-day-select';

interface Props {
  settings: UserSettings;
}

export function SettingsForm({ settings }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      const result = await commands.saveUserSettings(newSettings);
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const handleSave = (partial: Partial<UserSettings>) => {
    mutation.mutate({ ...settings, ...partial });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 닉네임 */}
      <SettingField label="닉네임">
        <TextInput
          value={settings.nickname}
          onSave={(value) => handleSave({ nickname: value })}
        />
      </SettingField>

      {/* 회사명 */}
      <SettingField label="회사명">
        <TextInput
          value={settings.companyName}
          onSave={(value) => handleSave({ companyName: value })}
        />
      </SettingField>

      {/* 월 실수령액 */}
      <SettingField label="월 실수령액">
        <SalaryInput
          value={settings.monthlyNetSalary}
          onSave={(value) => handleSave({ monthlyNetSalary: value })}
        />
      </SettingField>

      {/* 월급날 */}
      <SettingField label="월급날">
        <PayDaySelect
          value={settings.payDay}
          onSave={(value) => handleSave({ payDay: value })}
        />
      </SettingField>
    </div>
  );
}
```

### 4. 설정 필드 래퍼 (`src/features/settings/setting-field.tsx`)

```typescript
interface Props {
  label: string;
  children: React.ReactNode;
}

export function SettingField({ label, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-secondary">{label}</label>
      {children}
    </div>
  );
}
```

### 5. 입력 컴포넌트들

#### 텍스트 입력 (`src/features/settings/inputs/text-input.tsx`)

```typescript
import { useState } from 'react';

interface Props {
  value: string;
  onSave: (value: string) => void;
}

export function TextInput({ value, onSave }: Props) {
  const [localValue, setLocalValue] = useState(value);
  const hasChanged = localValue !== value && localValue.trim() !== '';

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="flex-1 rounded-lg border border-input bg-input px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
      />
      <button
        onClick={() => onSave(localValue)}
        disabled={!hasChanged}
        className="rounded-lg bg-primary px-3 py-2 text-sm text-white transition-opacity disabled:opacity-50"
      >
        저장
      </button>
    </div>
  );
}
```

#### 급여 입력 (`src/features/settings/inputs/salary-input.tsx`)

```typescript
import { useState } from 'react';

interface Props {
  value: number;
  onSave: (value: number) => void;
}

export function SalaryInput({ value, onSave }: Props) {
  const [localValue, setLocalValue] = useState(value.toLocaleString());

  const handleSave = () => {
    const num = parseInt(localValue.replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      onSave(num);
    }
  };

  const parsedValue = parseInt(localValue.replace(/,/g, ''), 10);
  const hasChanged = !isNaN(parsedValue) && parsedValue !== value && parsedValue > 0;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          inputMode="numeric"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="w-full rounded-lg border border-input bg-input px-3 py-2 pr-8 text-right text-sm transition-colors focus:border-primary focus:outline-none"
          placeholder="3,000,000"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-secondary">
          원
        </span>
      </div>
      <button
        onClick={handleSave}
        disabled={!hasChanged}
        className="rounded-lg bg-primary px-3 py-2 text-sm text-white transition-opacity disabled:opacity-50"
      >
        저장
      </button>
    </div>
  );
}
```

#### 월급날 선택 (`src/features/settings/inputs/pay-day-select.tsx`)

```typescript
import { useState } from 'react';

interface Props {
  value: number;
  onSave: (value: number) => void;
}

export function PayDaySelect({ value, onSave }: Props) {
  const [localValue, setLocalValue] = useState(value);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hasChanged = localValue !== value;

  return (
    <div className="flex gap-2">
      <select
        value={localValue}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        className="flex-1 rounded-lg border border-input bg-input px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
      >
        {days.map((day) => (
          <option key={day} value={day}>
            {day}일
          </option>
        ))}
      </select>
      <button
        onClick={() => onSave(localValue)}
        disabled={!hasChanged}
        className="rounded-lg bg-primary px-3 py-2 text-sm text-white transition-opacity disabled:opacity-50"
      >
        저장
      </button>
    </div>
  );
}
```

## 파일 구조

```
src/features/settings/
├── settings-panel.tsx      # 설정 패널 컨테이너
├── settings-header.tsx     # 헤더 (뒤로 버튼)
├── settings-form.tsx       # 설정 폼
├── setting-field.tsx       # 필드 래퍼
└── inputs/
    ├── text-input.tsx      # 텍스트 입력
    ├── salary-input.tsx    # 급여 입력
    └── pay-day-select.tsx  # 월급날 선택
```

## 완료 조건

- [ ] 설정 패널 레이아웃 구현
- [ ] 뒤로 버튼 (메인 패널로 전환)
- [ ] 닉네임 수정 입력
- [ ] 회사명 수정 입력
- [ ] 월 실수령액 수정 입력
- [ ] 월급날 선택 드롭다운
- [ ] 각 필드 저장 버튼
- [ ] TanStack Query 캐시 무효화
- [ ] 다크모드 UI 스타일링
