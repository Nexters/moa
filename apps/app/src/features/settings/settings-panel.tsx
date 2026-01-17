import { useUserSettings } from '~/hooks/use-user-settings';

import { SettingsForm } from './settings-form';
import { SettingsHeader } from './settings-header';

export function SettingsPanel() {
  const { data: settings, isLoading } = useUserSettings();

  if (isLoading || !settings) {
    return (
      <div className="flex w-80 items-center justify-center rounded-xl bg-neutral-900 p-8 shadow-lg">
        <div className="text-gray-400">로딩중...</div>
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col rounded-xl bg-neutral-900 shadow-lg">
      <SettingsHeader />
      <SettingsForm settings={settings} />
    </div>
  );
}
