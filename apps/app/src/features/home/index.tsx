import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import {
  useSalaryCalculator,
  type WorkStatus,
} from '~/hooks/use-salary-calculator';
import { useUserSettings } from '~/hooks/use-user-settings';
import { formatCurrency } from '~/lib/format';
import type { UserSettings } from '~/lib/tauri-bindings';
import { useUIStore } from '~/stores/ui-store';
import { AppBar } from '~/ui/app-bar';
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
      <div className="flex flex-col gap-4 p-4">
        <HeroSection salaryInfo={salaryInfo} />
        <InfoCard settings={settings} salaryInfo={salaryInfo} />
        <Button variant="tertiary" rounded="full" fullWidth disabled>
          근무 종료
        </Button>
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
      <p className="text-b2-400 text-text-medium">오늘 쌓은 월급</p>
      <p className="text-h1-700 text-success tabular-nums">
        {formatCurrency(salaryInfo.todayEarnings)}
      </p>
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
    <div className="bg-container-secondary flex flex-col divide-y divide-white/5 rounded-xl">
      <InfoRow label="근무 상태">
        <WorkStatusBadge status={salaryInfo.workStatus} />
      </InfoRow>
      <InfoRow label="오늘 근무 시간" value={`${workStart}-${workEnd}`} />
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
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-b2-400 text-text-medium">{label}</span>
      {children ?? <span className="text-b2-500 text-text-high">{value}</span>}
    </div>
  );
}

interface WorkStatusBadgeProps {
  status: WorkStatus;
}

function WorkStatusBadge({ status }: WorkStatusBadgeProps) {
  const config: Record<WorkStatus, { color: string; label: string }> = {
    working: { color: 'bg-success', label: '근무 중' },
    'not-working': { color: 'bg-gray-60', label: '근무 종료' },
    'day-off': { color: 'bg-info', label: '휴일' },
  };

  const { color, label } = config[status];

  return (
    <span className="text-b2-500 text-text-high flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
