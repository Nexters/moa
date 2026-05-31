import { formatCurrency, formatMonth } from '~/lib/format';
import {
  Button,
  InfoCard,
  InfoCardButtonRow,
  InfoCardDivider,
  InfoCardRow,
} from '~/ui';

import { HeroSection } from '../components/hero-section';
import type { HomeMainScreen } from '../hooks/use-home-screen';

export function PostCompletedScreen({
  settings,
  salaryInfo,
  todaySchedule,
  onAdjustWorkTime,
  onStillWorking,
}: Extract<HomeMainScreen, { screen: 'post-completed' }> & {
  onAdjustWorkTime: () => void;
}) {
  const workStart = todaySchedule?.workStartTime ?? settings.workStartTime;
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <HeroSection
        variant="full"
        label={`${formatMonth()} 누적 월급`}
        amount={salaryInfo.accumulatedEarnings}
        highlighted
      />

      <InfoCard>
        <InfoCardRow
          label="오늘 일급"
          value={formatCurrency(salaryInfo.todayEarnings)}
        />
        <InfoCardDivider />
        <InfoCardButtonRow
          label="근무 시간"
          detail={`${workStart} - ${workEnd}`}
          ariaLabel="근무시간 조정"
          onClick={onAdjustWorkTime}
        />
      </InfoCard>

      {onStillWorking && (
        <Button
          variant="link"
          size="md"
          className="mt-5"
          onClick={onStillWorking}
        >
          아직 근무 중이에요
        </Button>
      )}
    </div>
  );
}
