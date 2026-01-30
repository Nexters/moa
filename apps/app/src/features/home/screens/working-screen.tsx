import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import type { TodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { formatCurrency } from '~/lib/format';
import type { UserSettings } from '~/lib/tauri-bindings';
import { Badge, InfoCard, InfoCardDivider, InfoCardRow } from '~/ui';

import { HeroSection } from '../components/hero-section';

interface WorkingScreenProps {
  settings: UserSettings;
  salaryInfo: SalaryInfo;
  todaySchedule: TodayWorkSchedule | null;
}

export function WorkingScreen({
  settings,
  salaryInfo,
  todaySchedule,
}: WorkingScreenProps) {
  const workStart =
    todaySchedule?.workStartTime ?? settings.workStartTime ?? '09:00';
  const workEnd = todaySchedule?.workEndTime ?? settings.workEndTime ?? '18:00';

  return (
    <div className="flex flex-1 flex-col gap-7">
      <HeroSection
        variant="partial"
        label="오늘 쌓은 월급"
        amount={salaryInfo.todayEarnings}
      />
      <InfoCard>
        <InfoCardRow label="근무 상태">
          <Badge variant="green">근무 중</Badge>
        </InfoCardRow>
        <InfoCardDivider />
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
    </div>
  );
}
