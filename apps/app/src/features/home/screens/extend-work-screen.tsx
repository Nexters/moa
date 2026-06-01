import { useForm } from '@tanstack/react-form';

import type { WorkdaySchedule } from '~/hooks/use-workday';
import type { OnboardedUserSettings } from '~/lib/tauri-bindings';
import { timeToMinutes } from '~/lib/time';
import { AppBar, AppFooter, Button, Field } from '~/ui';
import { TimePeriodInput, type TimePeriodValue } from '~/ui/time-period-input';

import { getEffectiveWorkTime } from '../lib/effective-work-time';

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
  const { startTime, endTime: originalEndTime } = getEffectiveWorkTime(
    todaySchedule,
    settings,
  );

  const form = useForm({
    defaultValues: {
      period: { startTime, endTime: originalEndTime } as TimePeriodValue,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value.period.endTime);
      onBack();
    },
  });

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="scrollbar-overlay flex flex-1 flex-col gap-8 px-5 pb-5">
        <h1 className="t2-700 text-text-high">얼마나 더 일하나요?</h1>

        <form.Field name="period">
          {(field) => {
            const { endTime } = field.state.value;
            // 입력값이 아직 오늘 퇴근 시간 그대로면(열자마자) 경고를 숨긴다.
            // 사용자가 더 이른 시각으로 바꿨을 때만 경고를 노출.
            const error =
              !isEndAfterOriginal(startTime, originalEndTime, endTime) &&
              endTime !== originalEndTime
                ? '현재 퇴근 시간보다 늦게 설정해주세요.'
                : null;
            return (
              <Field.Root className="gap-3">
                <Field.Label>근무 시간</Field.Label>
                <TimePeriodInput
                  value={field.state.value}
                  onChange={(v) => field.handleChange({ ...v, startTime })}
                  disabledStart
                  error={error}
                  autoFocus
                />
              </Field.Root>
            );
          }}
        </form.Field>
      </div>

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
          <form.Subscribe
            selector={(state) => ({
              endTime: state.values.period.endTime,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ endTime, isSubmitting }) => (
              <Button
                variant="primary"
                rounded="full"
                size="lg"
                className="flex-1"
                disabled={
                  isPending ||
                  isSubmitting ||
                  !isEndAfterOriginal(startTime, originalEndTime, endTime)
                }
                onClick={() => form.handleSubmit()}
              >
                확인
              </Button>
            )}
          </form.Subscribe>
        </div>
      </AppFooter>
    </main>
  );
}
