import { useState } from 'react';

import { AppBar, AppFooter, Button, Field, TimeInput } from '~/ui';

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
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);

  const handleConfirm = () => {
    onConfirm(startTime, endTime);
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

        <div className="flex flex-col gap-5">
          <Field.Root>
            <Field.Label>출근 시간</Field.Label>
            <TimeInput value={startTime} onChange={setStartTime} />
          </Field.Root>
          <Field.Root>
            <Field.Label>퇴근 시간</Field.Label>
            <TimeInput value={endTime} onChange={setEndTime} />
          </Field.Root>
        </div>
      </div>

      <AppFooter>
        <Button
          variant="primary"
          rounded="full"
          size="lg"
          className="w-[240px]"
          onClick={handleConfirm}
        >
          확인
        </Button>
      </AppFooter>
    </main>
  );
}
