import { formatCurrency } from '~/lib/format';
import { InfoCard, InfoCardRow, InfoCardDivider, Button } from '~/ui';

import { HeroSection } from '../components/hero-section';
import { HomeMainScreen } from '../hooks/use-home-screen';

export function VacationScreen({
  salaryInfo,
  isPending,
  onTodayWork,
}: Extract<HomeMainScreen, { screen: 'vacation' }>) {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        variant="holiday"
        label="휴가 중 쌓은 월급"
        amount={salaryInfo.todayEarnings}
      />

      <InfoCard className="mt-7">
        <InfoCardRow label="근무 상태">
          <span className="b1-600 text-blue">휴가</span>
        </InfoCardRow>
        <InfoCardDivider />
        <InfoCardRow
          label="누적 월급"
          value={formatCurrency(salaryInfo.accumulatedEarnings)}
        />
      </InfoCard>

      <Button
        variant="link"
        size="md"
        className="mt-5"
        disabled={isPending}
        onClick={onTodayWork}
      >
        오늘 출근했어요
      </Button>
    </div>
  );
}
