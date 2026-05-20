import { useState } from 'react';

import { useTodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { AppBar, AppFooter, Button, Field } from '~/ui';
import { TimePeriodInput, type TimePeriodValue } from '~/ui/time-period-input';

import type { HomeMainScreen } from '../hooks/use-home-screen';

type WorkingScreenState = Extract<HomeMainScreen, { screen: 'working' }>;

interface AdjustTodayScheduleScreenProps {
  screenState: WorkingScreenState;
  onBack: () => void;
}

export function AdjustTodayScheduleScreen({
  screenState,
  onBack,
}: AdjustTodayScheduleScreenProps) {
  const { settings, todaySchedule, isPending, onVacation } = screenState;
  const { saveSchedule, isSaving } = useTodayWorkSchedule();
  const [value, setValue] = useState<TimePeriodValue>({
    startTime: todaySchedule?.workStartTime ?? settings.workStartTime,
    endTime: todaySchedule?.workEndTime ?? settings.workEndTime,
  });

  const disabled = isPending || isSaving;
  const isValid = value.startTime && value.endTime;

  const handleSave = async () => {
    await saveSchedule(value.startTime, value.endTime);
    onBack();
  };

  const handleVacation = () => {
    onVacation();
    onBack();
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" title="근무시간 조정" onBack={onBack} />

      <div className="scrollbar-overlay flex flex-1 flex-col p-5">
        <Field.Root className="gap-3">
          <Field.Label>오늘 근무 시간</Field.Label>
          <TimePeriodInput value={value} onChange={setValue} autoFocus />
        </Field.Root>

        <AppFooter>
          <Button
            rounded="full"
            size="lg"
            className="w-full"
            disabled={disabled || !isValid}
            onClick={handleSave}
          >
            {isSaving ? '저장 중...' : '저장'}
          </Button>
          <Button
            variant="link"
            size="flat"
            disabled={disabled}
            onClick={handleVacation}
          >
            오늘 휴가예요
          </Button>
        </AppFooter>
      </div>
    </main>
  );
}
