import { useNavigate } from '@tanstack/react-router';

import { useUserSettings } from '~/hooks/use-user-settings';
import { MAX_SALARY_AMOUNT } from '~/lib/constants';
import type { SalaryType, UserSettings } from '~/lib/tauri-bindings';
import {
  AppBar,
  AppFooter,
  Button,
  Field,
  NumberInput,
  SelectInput,
} from '~/ui';

import {
  SALARY_TYPE_OPTIONS,
  useSettingsForm,
} from '../hooks/use-settings-form';

export function EditSalaryScreen() {
  const { data: settings } = useUserSettings();

  if (!settings) return null;

  return <EditSalaryForm settings={settings} />;
}

interface EditSalaryFormProps {
  settings: UserSettings;
}

function EditSalaryForm({ settings }: EditSalaryFormProps) {
  const navigate = useNavigate();
  const goBack = () => navigate({ to: '/settings/salary-info' });
  const form = useSettingsForm({ settings, onSuccess: goBack });

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" title="월급 정보" onBack={goBack} />

      <div className="scrollbar-overlay flex flex-1 flex-col p-5">
        <div className="flex flex-col gap-6">
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

          <form.Field
            name="salaryAmount"
            validators={{
              onChange: ({ value }) => {
                if (value <= 0) return '급여 금액은 0보다 커야 합니다';
                if (value > MAX_SALARY_AMOUNT)
                  return `최대 ${(MAX_SALARY_AMOUNT / 10_000).toLocaleString()}만원까지 입력할 수 있습니다`;
                return undefined;
              },
            }}
          >
            {(field) => (
              <Field.Root
                name={field.name}
                invalid={field.state.meta.errors.length > 0}
              >
                <Field.Label>금액</Field.Label>
                <NumberInput
                  max={MAX_SALARY_AMOUNT / 10_000}
                  value={field.state.value / 10_000}
                  onValueChange={(v) => field.handleChange((v ?? 0) * 10_000)}
                />
                {field.state.meta.errors.filter(Boolean).map((error) => (
                  <Field.Error key={error}>{error}</Field.Error>
                ))}
              </Field.Root>
            )}
          </form.Field>

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
                  <Field.Label>월급일</Field.Label>
                  <NumberInput
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
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ salaryAmount, payDay, isSubmitting }) => {
            const isValid =
              salaryAmount > 0 &&
              salaryAmount <= MAX_SALARY_AMOUNT &&
              payDay >= 1 &&
              payDay <= 31;

            return (
              <AppFooter>
                <Button
                  rounded="full"
                  size="lg"
                  className="w-60"
                  disabled={!isValid || isSubmitting}
                  onClick={() => form.handleSubmit()}
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </Button>
              </AppFooter>
            );
          }}
        </form.Subscribe>
      </div>
    </main>
  );
}
