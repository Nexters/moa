import { useForm } from '@tanstack/react-form';

import type { WorkdaySchedule, WorkdayStatus } from '~/hooks/use-workday';
import type { OnboardedUserSettings } from '~/lib/tauri-bindings';
import { AppBar, AppFooter, Button, Field, ToggleInput } from '~/ui';
import { TimePeriodInput } from '~/ui/time-period-input';

import { getEffectiveWorkTime } from '../lib/effective-work-time';

type ScheduleType = 'work' | Extract<WorkdayStatus, 'annual-leave' | 'day-off'>;

const SCHEDULE_TYPE_OPTIONS = [
  { value: 'work', label: '근무' },
  { value: 'annual-leave', label: '연차' },
  { value: 'day-off', label: '휴무' },
] as const;

interface AdjustTodayScheduleScreenProps {
  settings: OnboardedUserSettings;
  todaySchedule: WorkdaySchedule | null;
  isPending?: boolean;
  onBack: () => void;
  onSave: (startTime: string, endTime: string) => Promise<void> | void;
  onSaveStatus: (status: WorkdayStatus) => Promise<void> | void;
}

export function AdjustTodayScheduleScreen({
  settings,
  todaySchedule,
  isPending,
  onBack,
  onSave,
  onSaveStatus,
}: AdjustTodayScheduleScreenProps) {
  const form = useForm({
    defaultValues: {
      scheduleType: 'work' as ScheduleType,
      period: getEffectiveWorkTime(todaySchedule, settings),
    },
    validators: {
      onSubmit: ({ value }) =>
        value.scheduleType === 'work' &&
        !(value.period.startTime && value.period.endTime)
          ? { fields: { period: '근무 시간을 입력해주세요' } }
          : undefined,
    },
    onSubmit: async ({ value }) => {
      if (value.scheduleType === 'work') {
        await onSave(value.period.startTime, value.period.endTime);
      } else {
        await onSaveStatus(value.scheduleType);
      }
      onBack();
    },
  });

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="scrollbar-overlay flex flex-1 flex-col gap-8 px-5 pb-5">
        <h1 className="t2-700 text-text-high">일정을 변경할까요?</h1>

        <form.Field name="scheduleType">
          {(field) => (
            <Field.Root className="gap-3">
              <Field.Label>어떤 일정인가요?</Field.Label>
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <ToggleInput
                    options={SCHEDULE_TYPE_OPTIONS}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={isPending || isSubmitting}
                  />
                )}
              </form.Subscribe>
            </Field.Root>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.scheduleType}>
          {(scheduleType) =>
            scheduleType === 'work' && (
              <form.Field name="period">
                {(field) => (
                  <Field.Root className="gap-3">
                    <Field.Label>근무 시간</Field.Label>
                    <TimePeriodInput
                      value={field.state.value}
                      onChange={field.handleChange}
                      autoFocus
                    />
                  </Field.Root>
                )}
              </form.Field>
            )
          }
        </form.Subscribe>
      </div>

      <AppFooter>
        <form.Subscribe
          selector={(state) => ({
            scheduleType: state.values.scheduleType,
            period: state.values.period,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ scheduleType, period, isSubmitting }) => {
            const disabled = isPending || isSubmitting;
            const isValid =
              scheduleType !== 'work' || !!(period.startTime && period.endTime);
            return (
              <div className="flex w-full gap-3">
                <Button
                  variant="tertiary"
                  rounded="full"
                  size="lg"
                  className="flex-1"
                  disabled={disabled}
                  onClick={onBack}
                >
                  취소
                </Button>
                <Button
                  rounded="full"
                  size="lg"
                  className="flex-1"
                  disabled={disabled || !isValid}
                  onClick={() => form.handleSubmit()}
                >
                  확인
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </AppFooter>
    </main>
  );
}
