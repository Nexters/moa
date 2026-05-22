import { formatCurrency, formatMonth } from '~/lib/format';
import {
  AppFooter,
  Button,
  InfoCard,
  InfoCardButtonRow,
  InfoCardDivider,
  InfoCardRow,
  TooltipBubble,
} from '~/ui';

import { HeroSection } from '../components/hero-section';
import { HomeMainScreen } from '../hooks/use-home-screen';

export function BeforeWorkScreen({
  settings,
  salaryInfo,
  todaySchedule,
  isPending,
  onStartWork,
  onAdjustWorkTime,
}: Extract<HomeMainScreen, { screen: 'before-work' }> & {
  onAdjustWorkTime: () => void;
}) {
  const workStart = todaySchedule?.workStartTime ?? settings.workStartTime;
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <HeroSection
        variant="empty"
        label={`${formatMonth()} 누적 월급`}
        amount={salaryInfo.accumulatedEarnings}
        highlighted
      />

      <InfoCard>
        <InfoCardRow
          label="오늘 일급"
          value={formatCurrency(salaryInfo.dailyRate)}
        />
        <InfoCardDivider />
        <InfoCardButtonRow
          label="근무 시간"
          detail={`${workStart} - ${workEnd}`}
          ariaLabel="근무시간 조정"
          onClick={onAdjustWorkTime}
        />
      </InfoCard>

      <AppFooter>
        <TooltipBubble size="sm">{workStart} 자동 출근 예정</TooltipBubble>
        <Button
          variant="primary"
          rounded="full"
          size="lg"
          className="w-full"
          disabled={isPending}
          onClick={onStartWork}
        >
          지금 출근하기
        </Button>
      </AppFooter>
    </div>
  );
}
