import { useConfetti } from '~/hooks/use-confetti';
import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import { formatCurrency } from '~/lib/format';
import type { UserSettings } from '~/lib/tauri-bindings';
import { Button, InfoCard, InfoCardDivider, InfoCardRow } from '~/ui';

import { HeroSection } from '../components/hero-section';

interface CompletedScreenProps {
  settings: UserSettings;
  salaryInfo: SalaryInfo;
  onClose?: () => void;
}

export function CompletedScreen({
  settings,
  salaryInfo,
  onClose,
}: CompletedScreenProps) {
  useConfetti();

  const workStart = settings.workStartTime ?? '09:00';
  const workEnd = settings.workEndTime ?? '18:00';

  return (
    <div className="flex flex-1 flex-col gap-7">
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
      <div className="flex justify-center">
        <Button
          variant="primary"
          rounded="full"
          size="lg"
          className="w-[240px]"
          onClick={onClose}
        >
          완료
        </Button>
      </div>
    </div>
  );
}
