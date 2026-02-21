import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { enable, disable } from '@tauri-apps/plugin-autostart';
import { openUrl } from '@tauri-apps/plugin-opener';
import { exit } from '@tauri-apps/plugin-process';

import { useUserSettings } from '~/hooks/use-user-settings';
import type { MenubarDisplayMode } from '~/lib/tauri-bindings';
import { commands } from '~/lib/tauri-bindings';
import { appQuery, appQueryOptions, userSettingsQuery } from '~/queries';
import { AppBar, Button, InfoRow, SelectInput, SwitchInput } from '~/ui';

import { SettingsSection } from '../components/settings-section';

const MENUBAR_DISPLAY_OPTIONS = [
  { value: 'none', label: '표기 안함' },
  { value: 'daily', label: '누적 일급' },
  { value: 'accumulated', label: '누적 월급' },
] as const;

export function SettingsScreen() {
  const navigate = useNavigate();
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
      void commands.notifySettingsChanged();
    },
  });

  const resetDataMutation = useMutation({
    mutationFn: async () => {
      const result = await commands.resetAllData();
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      void commands.notifySettingsChanged();
      queryClient.clear();
      void navigate({ to: '/onboarding/welcome' });
    },
  });

  const handleContactUs = async () => {
    const subject = encodeURIComponent('[문의] 모아 서비스에 문의드립니다.');
    const body = encodeURIComponent(
      [
        '문의 유형: (버그 신고 / 제휴·광고 / 계정·결제 / 신고 / 기능 제안 / 기타)',
        '상세 설명:',
        '스크린샷/영상(선택):',
        '',
        '-----------------------------------------------',
        '아래 정보는 앱에서 자동 기입됨',
        `앱 버전/빌드: v${version ?? 'unknown'}`,
      ].join('\n'),
    );
    try {
      await openUrl(
        `mailto:moa.mymoney@gmail.com?subject=${subject}&body=${body}`,
      );
    } catch {
      // OS handles mailto: errors natively
    }
  };

  return (
    <div className="bg-bg-primary flex h-full flex-col">
      <AppBar
        type="detail"
        title="설정"
        onBack={() => navigate({ to: '/home' })}
      />

      <div className="scrollbar-overlay flex min-h-0 flex-1 flex-col gap-5 p-5">
        <SettingsSection title="내 정보">
          <InfoRow
            as="button"
            label="월급 · 근무 정보"
            onClick={() => navigate({ to: '/settings/salary-info' })}
          />
        </SettingsSection>

        <SettingsSection title="메뉴바 설정">
          <SelectInput
            options={MENUBAR_DISPLAY_OPTIONS}
            value={settings?.menubarDisplayMode ?? 'daily'}
            onValueChange={(v) =>
              menubarDisplayModeMutation.mutate(v as MenubarDisplayMode)
            }
            disabled={!settings || menubarDisplayModeMutation.isPending}
          />
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
          <InfoRow as="button" label="문의하기" onClick={handleContactUs} />
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
