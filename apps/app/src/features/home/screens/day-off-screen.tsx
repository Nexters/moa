import { formatMonth } from '~/lib/format';
import { InfoCard, InfoCardRow, Button } from '~/ui';

import { HeroSection } from '../components/hero-section';
import type { HomeMainScreen } from '../hooks/use-home-screen';

export function DayOffScreen({
  salaryInfo,
  onTodayWork,
}: Extract<HomeMainScreen, { screen: 'day-off' }>) {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        variant="holiday"
        label={`${formatMonth()} 누적 월급`}
        amount={salaryInfo.accumulatedEarnings}
      />

      <InfoCard className="mt-7">
        <InfoCardRow label="근무 시간" value="근무 예정 없음" />
      </InfoCard>

      <Button variant="link" size="md" className="mt-5" onClick={onTodayWork}>
        오늘 출근했어요
      </Button>
    </div>
  );
}
