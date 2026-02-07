import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enable, disable } from '@tauri-apps/plugin-autostart';
import { exit } from '@tauri-apps/plugin-process';

import { useUserSettings } from '~/hooks/use-user-settings';
import { commands } from '~/lib/tauri-bindings';
import { appQuery, appQueryOptions, userSettingsQuery } from '~/queries';
import { useUIStore } from '~/stores/ui-store';
import { AppBar, Button, InfoRow, SwitchInput } from '~/ui';

import { SettingsSection } from '../components/settings-section';

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

  const menubarSalaryMutation = useMutation({
    mutationFn: async (showMenubarSalary: boolean) => {
      if (!settings) return;
      const result = await commands.saveUserSettings({
        ...settings,
        showMenubarSalary,
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

        <SettingsSection title="메뉴바 설정">
          <InfoRow label="실시간 금액 표시">
            <SwitchInput
              value={settings?.showMenubarSalary ?? true}
              onSave={(v) => menubarSalaryMutation.mutate(v)}
              disabled={!settings || menubarSalaryMutation.isPending}
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

        <SettingsSection title="앱 정보">
          <InfoRow label="버전 정보">
            <span className="text-text-medium">
              {version ? `v${version}` : '-'}
            </span>
          </InfoRow>
          <InfoRow as="button" label="문의하기" disabled />
        </SettingsSection>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="link"
            disabled={resetDataMutation.isPending}
            onClick={() => resetDataMutation.mutate()}
          >
            데이터 초기화
          </Button>
          <Button variant="link" onClick={() => exit(0)}>
            앱 종료하기
          </Button>
        </div>
      </div>
    </div>
  );
}
