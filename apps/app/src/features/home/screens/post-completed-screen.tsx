import { formatCurrency, formatMonth } from '~/lib/format';
import { InfoCard, InfoCardDivider, InfoCardRow } from '~/ui';

import { HeroSection } from '../components/hero-section';
import type { HomeMainScreen } from '../hooks/use-home-screen';

export function PostCompletedScreen({
  settings,
  salaryInfo,
  todaySchedule,
}: Extract<HomeMainScreen, { screen: 'post-completed' }>) {
  const workStart = todaySchedule?.workStartTime ?? settings.workStartTime;
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime;

  return (
    <div className="flex flex-1 flex-col gap-7">
      <HeroSection
        variant="full"
        label={`${formatMonth()} 누적 월급`}
        amount={salaryInfo.accumulatedEarnings}
      />
      <InfoCard>
        <InfoCardRow
          label="오늘 일급"
          value={`+ ${formatCurrency(salaryInfo.todayEarnings)}`}
        />
        <InfoCardDivider />
        <InfoCardRow label="근무 시간" value={`${workStart} - ${workEnd}`} />
      </InfoCard>
    </div>
  );
}
