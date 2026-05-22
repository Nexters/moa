import {
  AppFooter,
  Button,
  InfoCard,
  InfoCardButtonRow,
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
        <InfoCardRow label="근무 상태">
          <span className="b1-600 text-green-40">근무 중</span>
        </InfoCardRow>
        <InfoCardDivider />
        <InfoCardButtonRow
          label="근무 시간"
          value={`${workStart} - ${workEnd}`}
          ariaLabel="근무시간 조정"
          onClick={onAdjustWorkTime}
        />
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
