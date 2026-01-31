import { useState } from 'react';

import { AppBar, AppFooter, Button, Field } from '~/ui';
import {
  TimePeriodInput,
  isTimePeriodValid,
  type TimePeriodValue,
} from '~/ui/time-period-input';

interface AdjustWorkTimeScreenProps {
  defaultStartTime: string;
  defaultEndTime: string;
  onConfirm: (startTime: string, endTime: string) => void;
  onBack: () => void;
}

export function AdjustWorkTimeScreen({
  defaultStartTime,
  defaultEndTime,
  onConfirm,
  onBack,
}: AdjustWorkTimeScreenProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriodValue>({
    startTime: defaultStartTime,
    endTime: defaultEndTime,
  });

  const handleConfirm = () => {
    onConfirm(timePeriod.startTime, timePeriod.endTime);
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="flex flex-1 flex-col gap-8 px-5 pt-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="t2-700 text-text-high">몇시에 출근하셨나요?</h1>
          <p className="b2-400 text-text-medium">
            오늘의 출퇴근 시간을 확인해주세요.
          </p>
        </div>

        <Field.Root invalid={!isTimePeriodValid(timePeriod)}>
          <Field.Label>근무 시간</Field.Label>
          <TimePeriodInput
            value={timePeriod}
            onChange={setTimePeriod}
            autoFocus
          />
          <Field.Error>시작 시간이 종료 시간보다 늦을 수 없습니다.</Field.Error>
        </Field.Root>
      </div>

      <AppFooter>
        <Button
          variant="primary"
          rounded="full"
          size="lg"
          className="w-[240px]"
          disabled={!isTimePeriodValid(timePeriod)}
          onClick={handleConfirm}
        >
          확인
        </Button>
      </AppFooter>
    </main>
  );
}
