import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import { formatCurrency } from '~/lib/format';
import type { UserSettings } from '~/lib/tauri-bindings';

interface Props {
  settings: UserSettings;
  salaryInfo: SalaryInfo;
}

export function InfoSection({ settings, salaryInfo }: Props) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const defaultStatus = { icon: '⚪', label: '근무종료' };
  const statusConfig: Record<string, { icon: string; label: string }> = {
    working: { icon: '🟢', label: '근무중' },
    'not-working': { icon: '⚪', label: '근무종료' },
    'day-off': { icon: '🔵', label: '휴일' },
  };

  const status = statusConfig[salaryInfo.workStatus] ?? defaultStatus;
  const workStart = settings.workStartTime ?? '09:00';
  const workEnd = settings.workEndTime ?? '18:00';

  return (
    <div className="flex flex-1 flex-col">
      {/* 헤더: 날짜 */}
      <div className="border-b border-white/10 p-4">
        <p className="text-sm text-gray-400">{dateStr}</p>
      </div>

      {/* 메인: 누적 금액 */}
      <div className="flex-1 p-4">
        <p className="text-sm text-gray-400">누적 금액</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">
          {formatCurrency(salaryInfo.accumulatedEarnings)}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          {settings.payDay}일부터 {salaryInfo.workedDays + 1}일째
          {salaryInfo.workStatus === 'working' ? ' 벌고 있어요' : ''}
        </p>
      </div>

      {/* 푸터: 근무 상태 */}
      <div className="border-t border-white/10 p-4">
        <p className="font-medium">
          {status.icon} {status.label}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {workStart} ~ {workEnd}
        </p>
      </div>
    </div>
  );
}
