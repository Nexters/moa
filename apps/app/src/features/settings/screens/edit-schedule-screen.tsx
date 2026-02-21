import { useNavigate } from '@tanstack/react-router';

import { useUserSettings } from '~/hooks/use-user-settings';
import type { UserSettings } from '~/lib/tauri-bindings';
import { AppBar, AppFooter, Button, DayChipGroup, Field } from '~/ui';
import { TimePeriodInput } from '~/ui/time-period-input';

import { useSettingsForm } from '../hooks/use-settings-form';

export function EditScheduleScreen() {
  const { data: settings } = useUserSettings();

  if (!settings) return null;

  return <EditScheduleForm settings={settings} />;
}

interface EditScheduleFormProps {
  settings: UserSettings;
}

function EditScheduleForm({ settings }: EditScheduleFormProps) {
  const navigate = useNavigate();
  const goBack = () => navigate({ to: '/settings/salary-info' });
  const form = useSettingsForm({ settings, onSuccess: goBack });

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" title="근무 정보" onBack={goBack} />

      <div className="scrollbar-overlay flex flex-1 flex-col p-5">
        <div className="flex flex-col gap-8">
          <form.Field name="workDays">
            {(field) => (
              <Field.Root name={field.name} className="gap-3">
                <Field.Label>근무 요일</Field.Label>
                <DayChipGroup
                  selectedDays={field.state.value}
                  onChange={field.handleChange}
                />
              </Field.Root>
            )}
          </form.Field>

          <Field.Root className="gap-3">
            <Field.Label>근무 시간</Field.Label>
            <form.Subscribe
              selector={(s) => ({
                startTime: s.values.workStartTime,
                endTime: s.values.workEndTime,
              })}
            >
              {(value) => (
                <TimePeriodInput
                  value={value}
                  onChange={(v) => {
                    form.setFieldValue('workStartTime', v.startTime);
                    form.setFieldValue('workEndTime', v.endTime);
                  }}
                />
              )}
            </form.Subscribe>
          </Field.Root>
        </div>

        <form.Subscribe
          selector={(state) => ({
            workDays: state.values.workDays,
            workStartTime: state.values.workStartTime,
            workEndTime: state.values.workEndTime,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ workDays, workStartTime, workEndTime, isSubmitting }) => {
            const isValid = workDays.length > 0 && workStartTime && workEndTime;

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
