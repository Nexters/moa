import { formatCurrency, formatMonth } from '~/lib/format';
import {
  AppFooter,
  Button,
  InfoCard,
  InfoCardDivider,
  InfoCardRow,
  TooltipBubble,
} from '~/ui';
import { ChevronRightIcon } from '~/ui/icons';

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
        <button
          type="button"
          aria-label="근무시간 조정"
          className="-mx-2 flex h-[38px] cursor-pointer items-center justify-between gap-3 px-2 text-left"
          onClick={onAdjustWorkTime}
        >
          <span className="flex h-6 items-center gap-3">
            <span className="b1-400 text-text-medium">근무 시간</span>
            <span className="b1-600 text-text-high">
              {workStart} - {workEnd}
            </span>
          </span>
          <ChevronRightIcon className="text-text-low size-6 shrink-0" />
        </button>
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
