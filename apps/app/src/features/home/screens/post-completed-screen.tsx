import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import type { TodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { formatCurrency, formatMonth } from '~/lib/format';
import type { UserSettings } from '~/lib/tauri-bindings';
import {
  AppFooter,
  Button,
  InfoCard,
  InfoCardDivider,
  InfoCardRow,
} from '~/ui';

import { HeroSection } from '../components/hero-section';

interface PostCompletedScreenProps {
  settings: UserSettings;
  salaryInfo: SalaryInfo;
  todaySchedule: TodayWorkSchedule | null;
  onAdjustSchedule: () => void;
}

export function PostCompletedScreen({
  settings,
  salaryInfo,
  todaySchedule,
  onAdjustSchedule,
}: PostCompletedScreenProps) {
  const workStart =
    todaySchedule?.workStartTime ?? settings.workStartTime ?? '09:00';
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime ?? '18:00';

  return (
    <div className="flex flex-1 flex-col gap-7">
      <HeroSection
        variant="full"
        label={`${formatMonth()} 누적 월급`}
        amount={salaryInfo.accumulatedEarnings}
      />
      <InfoCard>
        <InfoCardRow
          label="오늘 쌓은 일급"
          value={formatCurrency(salaryInfo.todayEarnings)}
        />
        <InfoCardDivider />
        <InfoCardRow
          label="오늘 근무 시간"
          value={`${workStart} - ${workEnd}`}
        />
      </InfoCard>
      <AppFooter>
        <Button
          variant="primary"
          rounded="full"
          size="lg"
          className="w-[240px]"
          onClick={onAdjustSchedule}
        >
          내 근무 일정 수정하기
        </Button>
      </AppFooter>
    </div>
  );
}
