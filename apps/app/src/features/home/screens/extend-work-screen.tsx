import { useState } from 'react';

import type { WorkdaySchedule } from '~/hooks/use-workday';
import type { OnboardedUserSettings } from '~/lib/tauri-bindings';
import { timeToMinutes } from '~/lib/time';
import { AppBar, AppFooter, Button, Field } from '~/ui';
import { TimePeriodInput, type TimePeriodValue } from '~/ui/time-period-input';

interface ExtendWorkScreenProps {
  settings: OnboardedUserSettings;
  todaySchedule: WorkdaySchedule | null;
  isPending?: boolean;
  onBack: () => void;
  onSubmit: (newEndTime: string) => Promise<void> | void;
}

function isEndAfterOriginal(
  startTime: string,
  originalEndTime: string,
  newEndTime: string,
): boolean {
  const start = timeToMinutes(startTime);
  const origEnd = timeToMinutes(originalEndTime);
  const newEnd = timeToMinutes(newEndTime);

  // end < start 일 때만 다음날로 정규화. end == start 는 같은 날 0분 근무로
  // 취급해야 origEnd == start 인 경우에도 newEnd 와 같은 정규화 축에서 비교됨.
  const normalizedOrig = origEnd < start ? origEnd + 24 * 60 : origEnd;
  const normalizedNew = newEnd < start ? newEnd + 24 * 60 : newEnd;

  return normalizedNew > normalizedOrig;
}

export function ExtendWorkScreen({
  settings,
  todaySchedule,
  isPending,
  onBack,
  onSubmit,
}: ExtendWorkScreenProps) {
  const startTime = todaySchedule?.workStartTime ?? settings.workStartTime;
  const originalEndTime = todaySchedule?.workEndTime ?? settings.workEndTime;

  const [value, setValue] = useState<TimePeriodValue>({
    startTime,
    endTime: originalEndTime,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = isEndAfterOriginal(startTime, originalEndTime, value.endTime);
  const error = isValid ? null : '현재 퇴근 시간보다 늦게 설정해주세요.';
  const disabled = isPending || isSubmitting;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(value.endTime);
      onBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" title="얼마나 더 일하나요?" onBack={onBack} />

      <div className="scrollbar-overlay flex flex-1 flex-col p-5">
        <Field.Root className="gap-3">
          <Field.Label>근무 시간</Field.Label>
          <TimePeriodInput
            value={value}
            onChange={(v) => setValue({ ...v, startTime })}
            disabledStart
            error={error}
            autoFocus
          />
        </Field.Root>

        <AppFooter>
          <div className="flex w-full gap-3">
            <Button
              variant="tertiary"
              rounded="full"
              size="lg"
              className="flex-1"
              onClick={onBack}
            >
              취소
            </Button>
            <Button
              variant="primary"
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
