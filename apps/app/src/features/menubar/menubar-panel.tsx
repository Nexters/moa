import { SettingsPanel } from '~/features/settings';
import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
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

  return <MainPanel settings={settings} />;
}

function MainPanel({
  settings,
}: {
  settings: NonNullable<ReturnType<typeof useUserSettings>['data']>;
}) {
  const salaryInfo = useSalaryCalculator(settings);

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
