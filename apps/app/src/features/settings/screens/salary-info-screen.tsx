import { useUserSettings } from '~/hooks/use-user-settings';
import { type SalaryType } from '~/lib/tauri-bindings';
import { AppBar, InfoRow } from '~/ui';

import { SettingsSection } from '../components/settings-section';

interface Props {
  onBack: () => void;
  onNavigate: (screen: 'edit-salary' | 'edit-schedule') => void;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatSalary(amount: number, type?: SalaryType): string {
  const typeLabel = type === 'yearly' ? '연봉' : '월급';

  let formatted: string;
  const eok = Math.floor(amount / 100_000_000);
  const man = Math.floor((amount % 100_000_000) / 10_000);

  if (eok > 0 && man > 0) {
    formatted = `${eok}억 ${man}만원`;
  } else if (eok > 0) {
    formatted = `${eok}억원`;
  } else if (man > 0) {
    formatted = `${man}만원`;
  } else {
    formatted = `${amount.toLocaleString()}원`;
  }

  return `${typeLabel} · ${formatted}`;
}

function formatWorkDays(days: number[] | undefined): string {
  if (!days || days.length === 0) return '-';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d])
    .join(', ');
}

function formatTimeRange(
  start: string | undefined,
  end: string | undefined,
): string {
  if (!start || !end) return '-';
  return `${start}~${end}`;
}

export function SalaryInfoScreen({ onBack, onNavigate }: Props) {
  const { data: settings } = useUserSettings();

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" title="월급 · 근무 정보" onBack={onBack} />

      <div className="flex flex-col gap-5 overflow-y-auto p-5">
        <SettingsSection title="월급 정보">
          <InfoRow
            as="button"
            label="급여"
            onClick={() => onNavigate('edit-salary')}
          >
            <span className="text-green-40">
              {settings
                ? formatSalary(settings.salaryAmount, settings.salaryType)
                : '-'}
            </span>
          </InfoRow>
          <InfoRow
            as="button"
            label="월급일"
            onClick={() => onNavigate('edit-salary')}
          >
            <span className="text-green-40">
              {settings ? `${settings.payDay}일` : '-'}
            </span>
          </InfoRow>
        </SettingsSection>

        <SettingsSection title="근무 정보">
          <InfoRow
            as="button"
            label="근무 요일"
            onClick={() => onNavigate('edit-schedule')}
          >
            <span className="text-green-40">
              {settings ? formatWorkDays(settings.workDays) : '-'}
            </span>
          </InfoRow>
          <InfoRow
            as="button"
            label="근무 시간"
            onClick={() => onNavigate('edit-schedule')}
          >
            <span className="text-green-40">
              {settings
                ? formatTimeRange(settings.workStartTime, settings.workEndTime)
                : '-'}
            </span>
          </InfoRow>
        </SettingsSection>
      </div>
    </main>
  );
}
