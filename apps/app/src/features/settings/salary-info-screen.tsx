import { useUserSettings } from '~/hooks/use-user-settings';
import { type SalaryType } from '~/lib/tauri-bindings';
import { AppBar } from '~/ui';

import { SalaryInfoItem } from './salary-info-item';
import { SettingsSection } from './settings-section';

interface Props {
  onBack: () => void;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatSalary(type: SalaryType | undefined, amount: number): string {
  const typeLabel = type === 'yearly' ? '연봉' : '월급';
  const formatted =
    amount >= 10000
      ? `${Math.floor(amount / 10000)}만원`
      : `${amount.toLocaleString()}원`;
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

export function SalaryInfoScreen({ onBack }: Props) {
  const { data: settings } = useUserSettings();

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" title="월급 · 근무 정보" onBack={onBack} />

      <div className="flex flex-col gap-5 overflow-y-auto p-4">
        <SettingsSection title="월급 정보">
          <SalaryInfoItem
            label="급여"
            value={
              settings
                ? formatSalary(settings.salaryType, settings.salaryAmount)
                : '-'
            }
            disabled
          />
          <SalaryInfoItem
            label="월급일"
            value={settings ? `${settings.payDay}일` : '-'}
            disabled
          />
        </SettingsSection>

        <SettingsSection title="근무 정보">
          <SalaryInfoItem
            label="근무 요일"
            value={settings ? formatWorkDays(settings.workDays) : '-'}
            disabled
          />
          <SalaryInfoItem
            label="근무 시간"
            value={
              settings
                ? formatTimeRange(settings.workStartTime, settings.workEndTime)
                : '-'
            }
            disabled
          />
          <SalaryInfoItem
            label="점심 시간"
            value={
              settings
                ? formatTimeRange(
                    settings.lunchStartTime,
                    settings.lunchEndTime,
                  )
                : '-'
            }
            disabled
          />
        </SettingsSection>
      </div>
    </main>
  );
}
