# Form Management

This document describes the form management patterns used in the Moa app.

## Overview

| Use Case                 | Solution              | Rationale                                 |
| ------------------------ | --------------------- | ----------------------------------------- |
| Multi-step wizard forms  | TanStack Form         | Unified state, validation at submit       |
| Individual field updates | useMutation per field | Immediate persistence, optimistic updates |

## TanStack Form Pattern

Use TanStack Form for multi-step wizards or forms where all data is submitted together.

### Basic Setup

```typescript
// features/onboarding/use-onboarding-form.ts
import { useForm } from '@tanstack/react-form';

interface FormValues {
  field1: string;
  field2: number;
}

export function useMyForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm({
    defaultValues: {
      field1: '',
      field2: 0,
    },
    validators: {
      onSubmit: ({ value }) => {
        const errors: Record<string, string> = {};

        if (!value.field1) {
          errors.field1 = 'Required';
        }

        if (Object.keys(errors).length > 0) {
          return { fields: errors };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await saveData(value);
      onSuccess();
    },
  });

  return form;
}

export type MyForm = ReturnType<typeof useMyForm>;
```

### Using form.Field

```tsx
// Component using the form
function MyScreen({ form }: { form: MyForm }) {
  return (
    <form.Field name="field1">
      {(field) => (
        <div>
          <label>Field 1</label>
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
          {field.state.meta.errors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}
    </form.Field>
  );
}
```

### Using form.Subscribe

Subscribe to form state for conditional rendering:

```tsx
<form.Subscribe
  selector={(state) => ({
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
  })}
>
  {({ isValid, isSubmitting }) => (
    <Button
      disabled={!isValid || isSubmitting}
      onClick={() => form.handleSubmit()}
    >
      {isSubmitting ? 'Saving...' : 'Submit'}
    </Button>
  )}
</form.Subscribe>
```

## Multi-Step Wizard Pattern

For multi-step forms, create the form at the parent level and pass it to child screens:

```tsx
// Parent component
function Wizard() {
  const [step, setStep] = useState(0);
  const form = useMyForm({ onSuccess: () => navigate('/done') });

  return (
    <>
      {step === 0 && <Step1 form={form} onNext={() => setStep(1)} />}
      {step === 1 && <Step2 form={form} />}
    </>
  );
}

// Step components receive form as prop
function Step1({ form, onNext }: { form: MyForm; onNext: () => void }) {
  return <form.Field name="field1">{/* ... */}</form.Field>;
}
```

## Individual Field Updates Pattern

For settings where each field saves immediately (like Settings screen), use direct mutations:

```tsx
function SettingsField({ fieldName, currentValue }: Props) {
  const mutation = useMutation({
    mutationFn: async (value: string) => {
      await commands.updateSetting({ [fieldName]: value });
    },
  });

  return (
    <input
      value={currentValue}
      onChange={(e) => mutation.mutate(e.target.value)}
    />
  );
}
```

## When to Use Which

```
Is the form a multi-step wizard?
├─ Yes → TanStack Form
└─ No → Does the form submit all fields together?
        ├─ Yes → TanStack Form
        └─ No (each field saves independently) → useMutation per field
```

## Base UI Field Integration

프로젝트의 `Field` 컴포넌트는 Base UI Field를 래핑하여 일관된 스타일과 접근성을 제공합니다.

### Field 컴포넌트 구조

| 컴포넌트      | 역할             | Props                                              |
| ------------- | ---------------- | -------------------------------------------------- |
| `Field.Root`  | 필드 컨테이너    | `name`, `invalid`, `dirty`, `touched`, `className` |
| `Field.Label` | 접근성 지원 라벨 | `className`                                        |
| `Field.Error` | 에러 메시지 표시 | `className`                                        |

```tsx
// ui/field.tsx 구조
<Field.Root name="fieldName">
  <Field.Label>라벨 텍스트</Field.Label>
  {/* 입력 컴포넌트 */}
  <Field.Error>에러 메시지</Field.Error>
</Field.Root>
```

### 기본 통합 패턴

TanStack Form의 `form.Field`와 Base UI `Field` 컴포넌트를 결합합니다:

```tsx
<form.Field name="salaryType">
  {(field) => (
    <Field.Root name={field.name}>
      <Field.Label>급여 유형</Field.Label>
      <SelectInput
        options={SALARY_TYPE_OPTIONS}
        value={field.state.value}
        onValueChange={(v) => field.handleChange(v as SalaryType)}
        placeholder="급여 유형 선택"
      />
    </Field.Root>
  )}
</form.Field>
```

핵심 매핑:

- `field.name` → `Field.Root`의 `name`
- `field.state.value` → 입력 컴포넌트의 `value`
- `field.handleChange` → 입력 컴포넌트의 `onChange`/`onValueChange`

### 동적 라벨 패턴

`form.Subscribe`를 `form.Field` 내부에서 사용하여 다른 필드 값에 따라 라벨을 동적으로 변경합니다:

```tsx
<form.Field name="salaryAmount">
  {(field) => (
    <form.Subscribe selector={(state) => state.values.salaryType}>
      {(salaryType) => (
        <Field.Root name={field.name}>
          <Field.Label>
            {salaryType === 'monthly' ? '월 실수령액' : '연봉'}
          </Field.Label>
          <NumberInput
            value={field.state.value}
            onValueChange={(v) => field.handleChange(v ?? 0)}
          />
        </Field.Root>
      )}
    </form.Subscribe>
  )}
</form.Field>
```

### 유효성 검증 에러 표시

`Field.Error`를 사용하여 유효성 검증 에러를 표시합니다:

```tsx
<form.Field name="email">
  {(field) => (
    <Field.Root name={field.name} invalid={field.state.meta.errors.length > 0}>
      <Field.Label>이메일</Field.Label>
      <TextInput
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.map((error) => (
        <Field.Error key={error}>{error}</Field.Error>
      ))}
    </Field.Root>
  )}
</form.Field>
```

### 커스텀 간격 적용

기본 `Field.Root`는 `gap-2` 간격을 가집니다. `className`으로 오버라이드 가능합니다:

```tsx
<Field.Root name={field.name} className="gap-3">
  <Field.Label>근무 요일</Field.Label>
  <DayChipGroup
    selectedDays={field.state.value}
    onChange={field.handleChange}
  />
</Field.Root>
```

### 사용 가능한 입력 컴포넌트

| 컴포넌트       | 용도           | 주요 Props                                            |
| -------------- | -------------- | ----------------------------------------------------- |
| `SelectInput`  | 드롭다운 선택  | `options`, `value`, `onValueChange`, `placeholder`    |
| `NumberInput`  | 숫자 입력      | `value`, `onValueChange`, `suffix`, `formatThousands` |
| `TimeInput`    | 시간 입력      | `value`, `onChange`                                   |
| `DayChipGroup` | 요일 다중 선택 | `selectedDays`, `onChange`                            |

예제:

```tsx
// SelectInput
<SelectInput
  options={[{ value: 'monthly', label: '월급' }]}
  value={field.state.value}
  onValueChange={field.handleChange}
/>

// NumberInput
<NumberInput
  value={field.state.value}
  onValueChange={(v) => field.handleChange(v ?? 0)}
  suffix="원"
  formatThousands={true}
/>

// TimeInput
<TimeInput
  value={field.state.value}
  onChange={field.handleChange}
/>

// DayChipGroup
<DayChipGroup
  selectedDays={field.state.value}
  onChange={field.handleChange}
/>
```

## References

- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [Base UI Components](https://base-ui.com/)
