import { useLottieOverlay } from '~/hooks/use-lottie-overlay';
import type { SalaryInfo } from '~/hooks/use-salary-tick';
import type { TodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { formatCurrency } from '~/lib/format';
import type { OnboardedUserSettings } from '~/lib/tauri-bindings';
import {
  AppFooter,
  Button,
  InfoCard,
  InfoCardButtonRow,
  InfoCardDivider,
  InfoCardRow,
} from '~/ui';

import { HeroSection } from '../components/hero-section';

interface CompletedScreenProps {
  settings: OnboardedUserSettings;
  salaryInfo: SalaryInfo;
  todaySchedule: TodayWorkSchedule | null;
  isPending?: boolean;
  onAcknowledge: () => void;
  onAdjustWorkTime: () => void;
  onExtendWork: () => void;
}

export function CompletedScreen({
  settings,
  salaryInfo,
  todaySchedule,
  isPending,
  onAcknowledge,
  onAdjustWorkTime,
  onExtendWork,
}: CompletedScreenProps) {
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
          label="누적 월급"
          value={formatCurrency(salaryInfo.accumulatedEarnings)}
        />
        <InfoCardDivider />
        <InfoCardButtonRow
          label="근무 시간"
          value={`${workStart} - ${workEnd}`}
          ariaLabel="근무시간 조정"
          onClick={onAdjustWorkTime}
          disabled={isPending}
        />
      </InfoCard>
      <AppFooter>
        <div className="flex w-full gap-3">
          <Button
            variant="tertiary"
            rounded="full"
            size="lg"
            className="flex-1"
            disabled={isPending}
            onClick={onExtendWork}
          >
            더 일할게요
          </Button>
          <Button
            variant="primary"
            rounded="full"
            size="lg"
            className="flex-1"
            disabled={isPending}
            onClick={onAcknowledge}
          >
            완료
          </Button>
        </div>
      </AppFooter>
    </div>
  );
}
