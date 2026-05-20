import { AppFooter, Button, InfoCard, InfoCardDivider } from '~/ui';
import { ChevronRightIcon } from '~/ui/icons';

import { HeroSection } from '../components/hero-section';
import { HomeMainScreen } from '../hooks/use-home-screen';

export function WorkingScreen({
  settings,
  salaryInfo,
  todaySchedule,
  isPending,
  onEarlyLeave,
  onAdjustWorkTime,
}: Extract<HomeMainScreen, { screen: 'working' }> & {
  onAdjustWorkTime: () => void;
}) {
  const workStart = todaySchedule?.workStartTime ?? settings.workStartTime;
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <HeroSection
        variant="working"
        label="오늘 쌓은 월급"
        amount={salaryInfo.todayEarnings}
      />

      <InfoCard>
        <div className="flex flex-col items-start gap-1">
          <span className="b1-400 text-text-medium">근무 상태</span>
          <span className="b1-600 text-green-40">근무 중</span>
        </div>
        <InfoCardDivider />
        <button
          type="button"
          aria-label="근무시간 조정"
          className="hover:bg-interactive-hover -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors"
          onClick={onAdjustWorkTime}
        >
          <span className="flex flex-col items-start gap-1">
            <span className="b1-400 text-text-medium">근무 시간</span>
            <span className="b1-600 text-text-high">
              {workStart} - {workEnd}
            </span>
          </span>
          <ChevronRightIcon className="text-text-low size-6 shrink-0" />
        </button>
      </InfoCard>

      <AppFooter>
        <Button
          variant="primary"
          rounded="full"
          size="lg"
          className="w-full"
          disabled={isPending}
          onClick={onEarlyLeave}
        >
          일찍 퇴근하기
        </Button>
      </AppFooter>
    </div>
  );
}
