# Task 4: 온보딩 UI

## 목표

앱 최초 실행 시 사용자 정보를 수집하는 온보딩 플로우 UI를 구현한다.

## 스펙 참조

- [MVP 스펙](../mvp-spec.md)

## 온보딩 단계

| 단계 | 항목             | 설명                                                 |
| ---- | ---------------- | ---------------------------------------------------- |
| 1    | 닉네임 확인      | 랜덤 생성된 닉네임 표시 (다시 뽑기 가능)             |
| 2    | 회사명 확인      | 랜덤 생성된 회사명 표시 (다시 뽑기 가능)             |
| 3    | 월 실수령액 입력 | 세후 실제 받는 금액 입력                             |

> **참고**: 근무 요일(월~금), 출퇴근 시간(09:00~18:00), 월급날(25일)은 기본값으로 자동 설정됩니다.

## 구현 내용

### 1. 온보딩 상태 관리 (`src/stores/onboarding-store.ts`)

```typescript
import { create } from 'zustand';

interface OnboardingState {
  currentStep: number;
  data: {
    nickname: string;
    companyName: string;
    monthlyNetSalary: number;
  };
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingState['data']>) => void;
  regenerateNickname: () => void;
  regenerateCompany: () => void;
  reset: () => void;
}

// 랜덤 생성 함수
function generateRandomNickname(): string {
  const adjectives = ['성실한', '부지런한', '열정적인', '꼼꼼한', '유능한', '프로'];
  const characters = ['뚱이', '징징이', '다람이', '핑핑이', '보노보노', '포차코'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const char = characters[Math.floor(Math.random() * characters.length)];
  return `${adj} ${char}`;
}

function generateRandomCompany(): string {
  const companies = [
    '집게리아', '버거왕국', '초코파이공장', '별다방',
    '감자튀김연구소', '햄버거학교', '피자왕국', '치킨나라',
  ];
  return companies[Math.floor(Math.random() * companies.length)];
}

const createInitialData = () => ({
  nickname: generateRandomNickname(),
  companyName: generateRandomCompany(),
  monthlyNetSalary: 0,
});

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  data: createInitialData(),
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 3) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  updateData: (partial) => set((s) => ({ data: { ...s.data, ...partial } })),
  regenerateNickname: () =>
    set((s) => ({ data: { ...s.data, nickname: generateRandomNickname() } })),
  regenerateCompany: () =>
    set((s) => ({ data: { ...s.data, companyName: generateRandomCompany() } })),
  reset: () => set({ currentStep: 1, data: createInitialData() }),
}));
```

### 2. 온보딩 컨테이너 (`src/features/onboarding/onboarding.tsx`)

```typescript
import { useOnboardingStore } from '~/stores/onboarding-store';
import { StepNickname } from './steps/step-nickname';
import { StepCompany } from './steps/step-company';
import { StepSalary } from './steps/step-salary';

export function Onboarding() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  return (
    <div className="flex h-full flex-col">
      {/* Progress indicator */}
      <div className="flex gap-2 p-4">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded ${
              step <= currentStep ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 p-4">
        {currentStep === 1 && <StepNickname />}
        {currentStep === 2 && <StepCompany />}
        {currentStep === 3 && <StepSalary />}
      </div>
    </div>
  );
}
```

### 3. 각 단계 컴포넌트

#### Step 1: 닉네임 (`src/features/onboarding/steps/step-nickname.tsx`)

```typescript
import { useOnboardingStore } from '~/stores/onboarding-store';

export function StepNickname() {
  const data = useOnboardingStore((s) => s.data);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const regenerateNickname = useOnboardingStore((s) => s.regenerateNickname);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-bold">당신의 닉네임은</h2>

      <div className="text-3xl font-bold text-primary">{data.nickname}</div>

      <button
        onClick={regenerateNickname}
        className="text-sm text-gray-500 underline"
      >
        🎲 다시 뽑기
      </button>

      <button
        onClick={nextStep}
        className="w-full rounded bg-primary p-3 text-white"
      >
        다음
      </button>
    </div>
  );
}
```

#### Step 2: 회사명 (`src/features/onboarding/steps/step-company.tsx`)

```typescript
import { useOnboardingStore } from '~/stores/onboarding-store';

export function StepCompany() {
  const data = useOnboardingStore((s) => s.data);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const regenerateCompany = useOnboardingStore((s) => s.regenerateCompany);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-bold">오늘도 출근하는 곳은</h2>

      <div className="text-3xl font-bold text-primary">{data.companyName}</div>

      <button
        onClick={regenerateCompany}
        className="text-sm text-gray-500 underline"
      >
        🎲 다시 뽑기
      </button>

      <div className="flex w-full gap-2">
        <button
          onClick={prevStep}
          className="flex-1 rounded border p-3"
        >
          이전
        </button>
        <button
          onClick={nextStep}
          className="flex-1 rounded bg-primary p-3 text-white"
        >
          다음
        </button>
      </div>
    </div>
  );
}
```

#### Step 3: 월 실수령액 (`src/features/onboarding/steps/step-salary.tsx`)

```typescript
import { useState } from 'react';
import { useOnboardingStore } from '~/stores/onboarding-store';
import { commands } from '~/lib/tauri-bindings';

export function StepSalary() {
  const data = useOnboardingStore((s) => s.data);
  const updateData = useOnboardingStore((s) => s.updateData);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (data.monthlyNetSalary <= 0) return;

    setIsSubmitting(true);
    try {
      await commands.saveUserSettings({
        nickname: data.nickname,
        companyName: data.companyName,
        monthlyNetSalary: data.monthlyNetSalary,
        payDay: 25,
        onboardingCompleted: true,
      });
      // 메인 화면으로 전환 (React Router 또는 상태 변경)
    } catch (error) {
      console.error('설정 저장 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">월 실수령액을 알려주세요</h2>
      <p className="text-sm text-gray-500">세후 실제 통장에 들어오는 금액</p>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="3,000,000"
          value={data.monthlyNetSalary > 0 ? data.monthlyNetSalary.toLocaleString() : ''}
          onChange={(e) => {
            const num = parseInt(e.target.value.replace(/,/g, ''), 10);
            updateData({ monthlyNetSalary: isNaN(num) ? 0 : num });
          }}
          className="w-full rounded border p-3 pr-8 text-right text-xl"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          원
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={prevStep}
          className="flex-1 rounded border p-3"
        >
          이전
        </button>
        <button
          onClick={handleComplete}
          disabled={data.monthlyNetSalary <= 0 || isSubmitting}
          className="flex-1 rounded bg-primary p-3 text-white disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}
```

## 파일 구조

```
src/
├── features/
│   └── onboarding/
│       ├── onboarding.tsx
│       └── steps/
│           ├── step-nickname.tsx
│           ├── step-company.tsx
│           └── step-salary.tsx
└── stores/
    └── onboarding-store.ts
```

## 완료 조건

- [ ] 온보딩 스토어 구현 (랜덤 생성 함수 포함)
- [ ] 온보딩 컨테이너 구현
- [ ] Step 1: 닉네임 표시 + 다시 뽑기 UI
- [ ] Step 2: 회사명 표시 + 다시 뽑기 UI
- [ ] Step 3: 월 실수령액 입력 UI
- [ ] 온보딩 완료 시 설정 저장
- [ ] 앱 시작 시 온보딩 여부 체크 후 분기
