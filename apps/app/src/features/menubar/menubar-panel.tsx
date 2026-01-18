import { SettingsPanel } from '~/features/settings';
import {
  useSalaryCalculator,
  type SalaryInfo,
} from '~/hooks/use-salary-calculator';
import { useTrayIconSync } from '~/hooks/use-tray-icon-sync';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useUIStore } from '~/stores/ui-store';

import { InfoSection } from './info-section';
import { MenuSection } from './menu-section';

function OnboardingPrompt() {
  return (
    <div className="flex w-80 items-center justify-center rounded-xl bg-neutral-900 p-8 shadow-lg">
      <p className="text-center text-gray-400">설정을 완료해주세요</p>
    </div>
  );
}

export function MenubarPanel() {
  const { data: settings, isLoading } = useUserSettings();
  const showSettings = useUIStore((s) => s.showSettings);
  const salaryInfo = useSalaryCalculator(settings ?? null);

  // 트레이 아이콘 상태 동기화 (설정 화면에서도 동작)
  const isWorking = salaryInfo ? salaryInfo.workStatus === 'working' : null;
  useTrayIconSync(isWorking);

  // 로딩 중에는 빈 상태 표시
  if (isLoading) {
    return null;
  }

  // 온보딩 미완료 시 안내 표시
  if (!settings?.onboardingCompleted) {
    return <OnboardingPrompt />;
  }

  if (showSettings) {
    return <SettingsPanel />;
  }

  return <MainPanel settings={settings} salaryInfo={salaryInfo} />;
}

function MainPanel({
  settings,
  salaryInfo,
}: {
  settings: NonNullable<ReturnType<typeof useUserSettings>['data']>;
  salaryInfo: SalaryInfo | null;
}) {
  if (!salaryInfo) {
    return null;
  }

  return (
    <div className="flex w-80 rounded-xl bg-neutral-900 shadow-lg">
      <InfoSection settings={settings} salaryInfo={salaryInfo} />
      <MenuSection />
    </div>
  );
}
