import { SalaryInfo } from '~/hooks/use-salary-calculator';
import { formatCurrency } from '~/lib/format';
import {
  InfoCard,
  InfoCardRow,
  InfoCardDivider,
  AppFooter,
  Button,
  Badge,
} from '~/ui';

import { HeroSection } from '../components/hero-section';

interface HolidayScreenProps {
  salaryInfo: SalaryInfo;
  onClose?: () => void;
}

export function HolidayScreen({ salaryInfo, onClose }: HolidayScreenProps) {
  return (
    <div className="flex flex-1 flex-col gap-7">
      <HeroSection
        variant="holiday"
        label="휴가 중 쌓은 월급"
        amount={salaryInfo.todayEarnings}
      />
      <InfoCard>
        <InfoCardRow label="오늘 근무 시간">
          <Badge variant="blue">휴가</Badge>
        </InfoCardRow>
        <InfoCardDivider />
        <InfoCardRow
          label="이번달 누적 월급"
          value={formatCurrency(salaryInfo.accumulatedEarnings)}
        />
      </InfoCard>
      <AppFooter>
        <Button
          variant="tertiary"
          rounded="full"
          size="lg"
          className="w-[240px]"
          onClick={onClose}
        >
          오늘 출근했어요
        </Button>
      </AppFooter>
    </div>
  );
}
