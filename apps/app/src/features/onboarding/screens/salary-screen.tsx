import type { SalaryType } from '~/lib/tauri-bindings';
import {
  AppBar,
  AppFooter,
  Button,
  Field,
  NumberInput,
  SelectInput,
} from '~/ui';

import { SALARY_TYPE_OPTIONS } from '../hooks/use-onboarding-form';
import type { OnboardingScreenProps } from '../hooks/use-onboarding-screen';

export function SalaryScreen({ form, onNext, onBack }: OnboardingScreenProps) {
  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="flex flex-1 flex-col px-6 pt-4">
        <h1 className="t2-700 text-text-high">급여 정보를 알려주세요</h1>
        <p className="b2-500 text-text-medium mt-2">
          세전, 세후 상관없이 보고 싶은 금액을 입력해주세요.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          {/* 급여 유형 */}
          <form.Field name="salaryType">
            {(field) => (
              <Field.Root name={field.name}>
                <Field.Label>급여 유형</Field.Label>
                <SelectInput
                  options={SALARY_TYPE_OPTIONS}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as SalaryType)}
                />
              </Field.Root>
            )}
          </form.Field>

          {/* 급여 금액 */}
          <form.Field
            name="salaryAmount"
            validators={{
              onChange: ({ value }) =>
                value <= 0 ? '급여 금액은 0보다 커야 합니다' : undefined,
            }}
          >
            {(field) => (
              <form.Subscribe selector={(state) => state.values.salaryType}>
                {(salaryType) => (
                  <Field.Root
                    name={field.name}
                    invalid={field.state.meta.errors.length > 0}
                  >
                    <Field.Label>
                      {salaryType === 'monthly' ? '월 실수령액' : '연봉'}
                    </Field.Label>
                    <NumberInput
                      defaultValue={
                        salaryType === 'monthly' ? 3_000_000 : 36_000_000
                      }
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v ?? 0)}
                    />
                    {field.state.meta.errors.filter(Boolean).map((error) => (
                      <Field.Error key={error}>{error}</Field.Error>
                    ))}
                  </Field.Root>
                )}
              </form.Subscribe>
            )}
          </form.Field>

          {/* 급여일 */}
          <form.Field
            name="payDay"
            validators={{
              onChange: ({ value }) =>
                value < 1 || value > 31
                  ? '급여일은 1~31 사이여야 합니다'
                  : undefined,
            }}
          >
            {(field) => (
              <Field.Root
                name={field.name}
                invalid={field.state.meta.errors.length > 0}
              >
                <Field.Label>급여일</Field.Label>
                <NumberInput
                  defaultValue={25}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v ?? 0)}
                  suffix="일"
                  formatThousands={false}
                />
                {field.state.meta.errors.filter(Boolean).map((error) => (
                  <Field.Error key={error}>{error}</Field.Error>
                ))}
              </Field.Root>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({
            salaryAmountError: state.fieldMeta.salaryAmount?.errorMap.onChange,
            payDayError: state.fieldMeta.payDay?.errorMap.onChange,
          })}
        >
          {({ salaryAmountError, payDayError }) => (
            <AppFooter>
              <Button
                rounded="full"
                size="lg"
                className="w-60"
                disabled={!!salaryAmountError || !!payDayError}
                onClick={onNext}
              >
                다음
              </Button>
            </AppFooter>
          )}
        </form.Subscribe>
      </div>
    </main>
  );
}
