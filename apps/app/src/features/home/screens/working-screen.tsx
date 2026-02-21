import {
  AppFooter,
  Button,
  InfoCard,
  InfoCardDivider,
  InfoCardRow,
} from '~/ui';

import { HeroSection } from '../components/hero-section';
import { HomeMainScreen } from '../hooks/use-home-screen';

export function WorkingScreen({
  settings,
  salaryInfo,
  todaySchedule,
  isPending,
  onEarlyLeave,
  onVacation,
}: Extract<HomeMainScreen, { screen: 'working' }>) {
  const workStart = todaySchedule?.workStartTime ?? settings.workStartTime;
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime;

  return (
    <div className="flex flex-1 flex-col gap-7">
      <HeroSection
        variant="working"
        label="오늘 쌓은 월급"
        amount={salaryInfo.todayEarnings}
      />

      <InfoCard>
        <InfoCardRow label="근무 상태">
          <span className="b1-600 text-green-40">근무 중</span>
        </InfoCardRow>
        <InfoCardDivider />
        <InfoCardRow label="근무 시간" value={`${workStart} - ${workEnd}`} />
      </InfoCard>

      <AppFooter>
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="primary"
            rounded="full"
            size="lg"
            className="w-[240px]"
            disabled={isPending}
            onClick={onEarlyLeave}
          >
            일찍 퇴근하기
          </Button>
          <Button
            variant="link"
            size="md"
            disabled={isPending}
            onClick={onVacation}
          >
            오늘 휴가예요
          </Button>
        </div>
      </AppFooter>
    </div>
  );
}
