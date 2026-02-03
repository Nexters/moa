import { useUserSettings } from '~/hooks/use-user-settings';
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

interface Props {
  onBack: () => void;
}

export function EditSalaryScreen({ onBack }: Props) {
  const { data: settings } = useUserSettings();

  if (!settings) return null;

  return <EditSalaryForm settings={settings} onBack={onBack} />;
}

interface EditSalaryFormProps {
  settings: UserSettings;
  onBack: () => void;
}

function EditSalaryForm({ settings, onBack }: EditSalaryFormProps) {
  const form = useSettingsForm({ settings, onSuccess: onBack });

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" title="월급 정보" onBack={onBack} />

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

          <form.Field name="salaryAmount">
            {(field) => (
              <Field.Root name={field.name}>
                <Field.Label>금액</Field.Label>
                <NumberInput
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v ?? 0)}
                />
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
            const isValid = salaryAmount > 0 && payDay >= 1 && payDay <= 31;

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
