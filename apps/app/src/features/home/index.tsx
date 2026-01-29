import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import {
  useSalaryCalculator,
  type WorkStatus,
} from '~/hooks/use-salary-calculator';
import { useUserSettings } from '~/hooks/use-user-settings';
import { formatCurrency, formatNumber } from '~/lib/format';
import type { UserSettings } from '~/lib/tauri-bindings';
import { useUIStore } from '~/stores/ui-store';
import { AppBar } from '~/ui/app-bar';
import { Badge } from '~/ui/badge';
import { Button } from '~/ui/button';
import { MoaMoneyIcon } from '~/ui/icons';

export function Home() {
  const { data: settings, isLoading } = useUserSettings();
  const navigate = useUIStore((s) => s.navigate);
  const salaryInfo = useSalaryCalculator(settings ?? null);

  if (isLoading || !settings) {
    return null;
  }

  return (
    <MainPanel
      settings={settings}
      salaryInfo={salaryInfo}
      onSettings={() => navigate('settings')}
    />
  );
}

interface MainPanelProps {
  settings: UserSettings;
  salaryInfo: SalaryInfo | null;
  onSettings: () => void;
}

function MainPanel({ settings, salaryInfo, onSettings }: MainPanelProps) {
  if (!salaryInfo) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="main" onSettings={onSettings} />

      <div className="flex flex-1 flex-col gap-7 px-5 pt-3">
        <HeroSection salaryInfo={salaryInfo} />
        <InfoCard settings={settings} salaryInfo={salaryInfo} />
        <div className="flex justify-center">
          <Button
            variant="tertiary"
            rounded="full"
            size="lg"
            className="w-[240px]"
          >
            근무 종료
          </Button>
        </div>
      </div>
    </main>
  );
}

interface HeroSectionProps {
  salaryInfo: SalaryInfo;
}

function HeroSection({ salaryInfo }: HeroSectionProps) {
  const isWorking = salaryInfo.workStatus === 'working';

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <MoaMoneyIcon variant={isWorking ? 'active' : 'default'} />
      <p className="b2-400 text-text-medium">오늘 쌓은 월급</p>
      <div className="flex items-end justify-center gap-1">
        <p className="h1-700 text-green-40 tabular-nums">
          {formatNumber(salaryInfo.todayEarnings)}
        </p>
        <p className="h3-500 text-text-medium">원</p>
      </div>
    </div>
  );
}

interface InfoCardProps {
  settings: UserSettings;
  salaryInfo: SalaryInfo;
}

function InfoCard({ settings, salaryInfo }: InfoCardProps) {
  const workStart = settings.workStartTime ?? '09:00';
  const workEnd = settings.workEndTime ?? '18:00';

  return (
    <div className="bg-container-primary flex flex-col gap-3.5 rounded-lg p-4">
      <InfoRow label="근무 상태">
        <Badge variant={salaryInfo.workStatus === 'working' ? 'green' : 'blue'}>
          {salaryInfo.workStatus === 'working' ? '근무 중' : '근무 종료'}
        </Badge>
      </InfoRow>
      <hr className="border-divider-secondary" />
      <InfoRow label="오늘 근무 시간" value={`${workStart} - ${workEnd}`} />
      <hr className="border-divider-secondary" />
      <InfoRow
        label="이번달 누적 월급"
        value={formatCurrency(salaryInfo.accumulatedEarnings)}
      />
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
}

function InfoRow({ label, value, children }: InfoRowProps) {
  return (
    <div className="flex h-6 items-center justify-between">
      <span className="b1-400 text-text-medium">{label}</span>
      {children ?? <span className="b1-600 text-text-high">{value}</span>}
    </div>
  );
}
