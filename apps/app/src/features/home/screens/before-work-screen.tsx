import { formatCurrency, formatMonth } from '~/lib/format';
import {
  AppFooter,
  Button,
  InfoCard,
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
  onVacation,
  onStartWork,
}: Extract<HomeMainScreen, { screen: 'before-work' }>) {
  const workStart = todaySchedule?.workStartTime ?? settings.workStartTime;
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime;

  return (
    <div className="flex flex-1 flex-col gap-7">
      <HeroSection
        variant="empty"
        label={`${formatMonth()} 누적 월급`}
        amount={salaryInfo.accumulatedEarnings}
      />

      <InfoCard>
        <InfoCardRow
          label="오늘 일급"
          value={formatCurrency(salaryInfo.dailyRate)}
        />
        <InfoCardDivider />
        <InfoCardRow label="근무 시간" value={`${workStart} - ${workEnd}`} />
      </InfoCard>

      <AppFooter>
        <div className="flex flex-col items-center gap-3">
          <TooltipBubble>{workStart} 자동 출근 예정</TooltipBubble>
          <Button
            variant="primary"
            rounded="full"
            size="lg"
            className="w-[240px]"
            onClick={onStartWork}
          >
            일찍 출근하기
          </Button>
          <Button variant="link" size="md" onClick={onVacation}>
            오늘 휴가예요
          </Button>
        </div>
      </AppFooter>
    </div>
  );
}
