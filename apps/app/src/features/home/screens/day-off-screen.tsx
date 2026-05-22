import { formatMonth } from '~/lib/format';
import { AppFooter, Button, InfoCard, InfoCardRow } from '~/ui';

import { HeroSection } from '../components/hero-section';
import type { HomeMainScreen } from '../hooks/use-home-screen';

type NonWorkingScreenState = Extract<HomeMainScreen, { screen: 'non-working' }>;

const STATUS_LABEL: Record<NonWorkingScreenState['status'], string> = {
  'annual-leave': '연차',
  'day-off': '근무 없음',
  'public-holiday': '공휴일',
};

export function DayOffScreen({
  status,
  salaryInfo,
  isPending,
  onTodayWork,
}: NonWorkingScreenState) {
  const isAnnualLeave = status === 'annual-leave';

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        variant="holiday"
        label={
          isAnnualLeave ? '연차 중 쌓은 월급' : `${formatMonth()} 누적 월급`
        }
        amount={
          isAnnualLeave
            ? salaryInfo.todayEarnings
            : salaryInfo.accumulatedEarnings
        }
      />

      <InfoCard className="mt-7">
        <InfoCardRow label="근무 상태" value={STATUS_LABEL[status]} />
      </InfoCard>

      <AppFooter>
        <Button
          variant="tertiary"
          rounded="full"
          size="lg"
          className="w-full"
          disabled={isPending}
          onClick={onTodayWork}
        >
          오늘 출근했어요
        </Button>
      </AppFooter>
    </div>
  );
}
