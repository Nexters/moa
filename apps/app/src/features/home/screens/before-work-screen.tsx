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

interface BeforeWorkScreenProps {
  settings: UserSettings;
  salaryInfo: SalaryInfo;
  todaySchedule: TodayWorkSchedule | null;
  isDayOff?: boolean;
  onVacation: () => void;
  onStartWork: () => void;
}

export function BeforeWorkScreen({
  settings,
  salaryInfo,
  todaySchedule,
  isDayOff,
  onVacation,
  onStartWork,
}: BeforeWorkScreenProps) {
  const workStart =
    todaySchedule?.workStartTime ?? settings.workStartTime ?? '09:00';
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime ?? '18:00';

  return (
    <div className="flex flex-1 flex-col gap-7">
      <HeroSection
        variant="empty"
        label={`${formatMonth()} 누적 월급`}
        amount={salaryInfo.accumulatedEarnings}
      />
      <InfoCard>
        <InfoCardRow
          label="오늘 예상 일급"
          value={isDayOff ? '휴무' : formatCurrency(salaryInfo.dailyRate)}
        />
        <InfoCardDivider />
        <InfoCardRow
          label="오늘 근무 시간"
          value={isDayOff ? '휴무' : `${workStart} - ${workEnd}`}
        />
      </InfoCard>
      <AppFooter>
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="primary"
            rounded="full"
            size="lg"
            className="w-[240px]"
            onClick={onStartWork}
          >
            돈 벌러 가기
          </Button>
          {!isDayOff && (
            <Button variant="link" size="md" onClick={onVacation}>
              오늘 휴가예요
            </Button>
          )}
        </div>
      </AppFooter>
    </div>
  );
}
