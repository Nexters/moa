import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enable, disable } from '@tauri-apps/plugin-autostart';

import { useUserSettings } from '~/hooks/use-user-settings';
import type { MenubarDisplayMode } from '~/lib/tauri-bindings';
import { commands } from '~/lib/tauri-bindings';
import { appQuery, appQueryOptions, userSettingsQuery } from '~/queries';
import { useUIStore } from '~/stores/ui-store';
import { AppBar, InfoRow, SelectInput, SwitchInput } from '~/ui';

import { SettingsSection } from '../components/settings-section';

const MENUBAR_DISPLAY_OPTIONS = [
  { value: 'none', label: '표기 안함' },
  { value: 'daily', label: '일급' },
  { value: 'accumulated', label: '누적 월급' },
] as const;

interface Props {
  onNavigate: (screen: 'salary-info') => void;
}

export function SettingsScreen({ onNavigate }: Props) {
  const navigate = useUIStore((s) => s.navigate);
  const queryClient = useQueryClient();
  const { data: settings } = useUserSettings();

  const { data: version } = useQuery(appQueryOptions.version());

  const { data: autoStartEnabled = false, isLoading: isAutoStartLoading } =
    useQuery(appQueryOptions.autostart());

  const autoStartMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appQuery.autostart() });
    },
  });

  const menubarDisplayModeMutation = useMutation({
    mutationFn: async (menubarDisplayMode: MenubarDisplayMode) => {
      if (!settings) return;
      const result = await commands.saveUserSettings({
        ...settings,
        menubarDisplayMode,
      });
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
    },
  });

  const resetDataMutation = useMutation({
    mutationFn: async () => {
      const result = await commands.resetAllData();
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('onboarding');
    },
  });

  return (
    <div className="bg-bg-primary flex h-full flex-col">
      <AppBar type="detail" title="설정" onBack={() => navigate('home')} />

      <div className="scrollbar-overlay flex min-h-0 flex-1 flex-col gap-5 p-5">
        <SettingsSection title="내 정보">
          <InfoRow
            as="button"
            label="월급 · 근무 정보"
            onClick={() => onNavigate('salary-info')}
          />
        </SettingsSection>

        <SettingsSection title="앱 정보 및 도움말">
          <InfoRow label="버전 정보">
            <span className="text-text-medium">
              {version ? `v${version}` : '-'}
            </span>
          </InfoRow>
          <InfoRow as="button" label="문의하기" disabled />
        </SettingsSection>

        <SettingsSection title="메뉴바 설정">
          <InfoRow label="실시간 금액 표시">
            <SelectInput
              className="w-auto bg-transparent px-0 py-0"
              options={MENUBAR_DISPLAY_OPTIONS}
              value={settings?.menubarDisplayMode ?? 'daily'}
              onValueChange={(v) =>
                menubarDisplayModeMutation.mutate(v as MenubarDisplayMode)
              }
              disabled={!settings || menubarDisplayModeMutation.isPending}
            />
          </InfoRow>
          <InfoRow label="로그인 시 MOA 자동 실행">
            <SwitchInput
              value={autoStartEnabled}
              onSave={(enabled) => autoStartMutation.mutate(enabled)}
              disabled={isAutoStartLoading || autoStartMutation.isPending}
            />
          </InfoRow>
        </SettingsSection>

        {process.env.NODE_ENV === 'development' && (
          <SettingsSection title="개발자 메뉴" className="opacity-70">
            <InfoRow
              as="button"
              label="데이터 초기화"
              disabled={resetDataMutation.isPending}
              onClick={() => resetDataMutation.mutate()}
            />
          </SettingsSection>
        )}
      </div>
    </div>
  );
}
