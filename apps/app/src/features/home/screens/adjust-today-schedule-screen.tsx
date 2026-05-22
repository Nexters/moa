import { useState } from 'react';

import type { TodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import type { TodayWorkStatus } from '~/hooks/use-today-work-status';
import type { OnboardedUserSettings } from '~/lib/tauri-bindings';
import { AppBar, AppFooter, Button, Field, ToggleInput } from '~/ui';
import { TimePeriodInput, type TimePeriodValue } from '~/ui/time-period-input';

type ScheduleType =
  | 'work'
  | Extract<TodayWorkStatus, 'annual-leave' | 'day-off'>;

const SCHEDULE_TYPE_OPTIONS = [
  { value: 'work', label: '근무' },
  { value: 'annual-leave', label: '연차' },
  { value: 'day-off', label: '휴무' },
] as const;

interface AdjustTodayScheduleScreenProps {
  settings: OnboardedUserSettings;
  todaySchedule: TodayWorkSchedule | null;
  isPending?: boolean;
  showStatusOptions?: boolean;
  onBack: () => void;
  onSave: (startTime: string, endTime: string) => Promise<void> | void;
  onSaveStatus?: (status: TodayWorkStatus) => Promise<void> | void;
}

export function AdjustTodayScheduleScreen({
  settings,
  todaySchedule,
  isPending,
  showStatusOptions,
  onBack,
  onSave,
  onSaveStatus,
}: AdjustTodayScheduleScreenProps) {
  const [value, setValue] = useState<TimePeriodValue>({
    startTime: todaySchedule?.workStartTime ?? settings.workStartTime,
    endTime: todaySchedule?.workEndTime ?? settings.workEndTime,
  });
  const [scheduleType, setScheduleType] = useState<ScheduleType>('work');
  const [isSaving, setIsSaving] = useState(false);

  const disabled = isPending || isSaving;
  const isWork = scheduleType === 'work';
  const isValid = isWork ? value.startTime && value.endTime : !!onSaveStatus;

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      if (isWork) {
        await onSave(value.startTime, value.endTime);
      } else {
        await onSaveStatus?.(scheduleType);
      }
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="scrollbar-overlay flex flex-1 flex-col px-5 pb-5">
        <div className="flex flex-col gap-8">
          <h1 className="t2-700 text-text-high">일정을 변경할까요?</h1>

          {showStatusOptions && (
            <Field.Root className="gap-3">
              <Field.Label>어떤 일정인가요?</Field.Label>
              <ToggleInput
                options={SCHEDULE_TYPE_OPTIONS}
                value={scheduleType}
                onValueChange={setScheduleType}
                disabled={disabled}
              />
            </Field.Root>
          )}

          {isWork && (
            <Field.Root className="gap-3">
              <Field.Label>근무 시간</Field.Label>
              <TimePeriodInput value={value} onChange={setValue} autoFocus />
            </Field.Root>
          )}
        </div>

        <AppFooter>
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
              onClick={handleConfirm}
            >
              확인
            </Button>
          </div>
        </AppFooter>
      </div>
    </main>
  );
}
