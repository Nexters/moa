import { useLottieOverlay } from '~/hooks/use-lottie-overlay';
import { formatCurrency } from '~/lib/format';
import {
  AppFooter,
  Button,
  InfoCard,
  InfoCardDivider,
  InfoCardRow,
} from '~/ui';

import { HeroSection } from '../components/hero-section';
import type { HomeMainScreen } from '../hooks/use-home-screen';

export function CompletedScreen({
  settings,
  salaryInfo,
  todaySchedule,
  onAcknowledge,
}: Extract<HomeMainScreen, { screen: 'completed' }>) {
  const lottieOverlay = useLottieOverlay();

  const workStart = todaySchedule?.workStartTime ?? settings.workStartTime;
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime;

  return (
    <div className="flex flex-1 flex-col gap-5">
      {lottieOverlay}
      <HeroSection
        variant="full"
        label="오늘 쌓은 월급"
        amount={salaryInfo.todayEarnings}
      />
      <InfoCard>
        <InfoCardRow
          label="오늘 근무 시간"
          value={`${workStart} - ${workEnd}`}
        />
        <InfoCardDivider />
        <InfoCardRow
          label="이번달 누적 월급"
          value={formatCurrency(salaryInfo.accumulatedEarnings)}
        />
      </InfoCard>
      <AppFooter>
        <Button
          variant="primary"
          rounded="full"
          size="lg"
          className="w-[240px]"
          onClick={onAcknowledge}
        >
          완료
        </Button>
      </AppFooter>
    </div>
  );
}
