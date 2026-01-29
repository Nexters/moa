import type { SalaryType } from '~/lib/tauri-bindings';
import { AppBar, Button, Field, NumberInput, SelectInput } from '~/ui';

import { SALARY_TYPE_OPTIONS } from './hooks/use-onboarding-form';
import type { OnboardingScreenProps } from './hooks/use-onboarding-screen';

export function SalaryScreen({ form, onNext, onBack }: OnboardingScreenProps) {
  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="flex flex-1 flex-col px-6 pt-4">
        <h1 className="text-t2-700 text-text-high">급여 정보를 알려주세요</h1>
        <p className="text-b2-500 text-text-medium mt-2">
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
          <form.Field name="salaryAmount">
            {(field) => (
              <form.Subscribe selector={(state) => state.values.salaryType}>
                {(salaryType) => (
                  <Field.Root name={field.name}>
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
                  </Field.Root>
                )}
              </form.Subscribe>
            )}
          </form.Field>

          {/* 급여일 */}
          <form.Field name="payDay">
            {(field) => {
              const handlePayDayChange = (value: number) => {
                if (value >= 1 && value <= 31) {
                  field.handleChange(value);
                } else if (value === 0) {
                  field.handleChange(1);
                } else if (value > 31) {
                  field.handleChange(31);
                }
              };

              return (
                <Field.Root name={field.name}>
                  <Field.Label>급여일</Field.Label>
                  <NumberInput
                    defaultValue={25}
                    value={field.state.value}
                    onValueChange={(v) => handlePayDayChange(v ?? 0)}
                    suffix="일"
                    formatThousands={false}
                  />
                </Field.Root>
              );
            }}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({
            salaryAmount: state.values.salaryAmount,
            payDay: state.values.payDay,
          })}
        >
          {({ salaryAmount, payDay }) => {
            const isValid = salaryAmount > 0 && payDay >= 1 && payDay <= 31;

            return (
              <div className="absolute inset-x-0 bottom-9 flex justify-center">
                <Button
                  rounded="full"
                  size="lg"
                  className="w-60"
                  disabled={!isValid}
                  onClick={onNext}
                >
                  다음
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </div>
    </main>
  );
}
