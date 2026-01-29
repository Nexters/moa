import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getVersion } from '@tauri-apps/api/app';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

import { useUIStore } from '~/stores/ui-store';
import { AppBar, InfoRow, SwitchInput } from '~/ui';

import { ResetDataButton } from './reset-data-button';
import { SettingsSection } from './settings-section';

interface Props {
  onNavigate: (screen: 'salary-info') => void;
}

export function SettingsScreen({ onNavigate }: Props) {
  const navigate = useUIStore((s) => s.navigate);
  const queryClient = useQueryClient();

  const { data: version } = useQuery({
    queryKey: ['appVersion'],
    queryFn: getVersion,
    staleTime: Infinity,
  });

  const { data: autoStartEnabled = false, isLoading: isAutoStartLoading } =
    useQuery({
      queryKey: ['autostart'],
      queryFn: isEnabled,
      staleTime: Infinity,
    });

  const autoStartMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['autostart'] });
    },
  });

  return (
    <div className="bg-bg-primary flex h-full flex-col">
      <AppBar type="detail" title="설정" onBack={() => navigate('home')} />

      <div className="flex flex-col gap-5 overflow-y-auto p-4">
        <SettingsSection title="내 정보">
          <InfoRow
            as="button"
            label="월급 · 근무 정보"
            onClick={() => onNavigate('salary-info')}
          />
        </SettingsSection>

        <SettingsSection title="앱 정보 및 도움말">
          <InfoRow label="버전 정보">
            <span className="text-text-medium">{version ?? '-'}</span>
          </InfoRow>
          <InfoRow as="button" label="문의하기" disabled />
        </SettingsSection>

        <SettingsSection title="자동 실행">
          <InfoRow label="로그인 시 MOA 자동 실행">
            <SwitchInput
              value={autoStartEnabled}
              onSave={(enabled) => autoStartMutation.mutate(enabled)}
              disabled={isAutoStartLoading || autoStartMutation.isPending}
            />
          </InfoRow>
        </SettingsSection>

        <SettingsSection title="위험 영역">
          <ResetDataButton />
        </SettingsSection>
      </div>
    </div>
  );
}
