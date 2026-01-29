import { useQuery } from '@tanstack/react-query';
import { getVersion } from '@tauri-apps/api/app';
import { useState } from 'react';

import { useUIStore } from '~/stores/ui-store';
import { AppBar } from '~/ui';

import { ResetDataButton } from './reset-data-button';
import { SettingsInfoItem } from './settings-info-item';
import { SettingsNavItem } from './settings-nav-item';
import { SettingsSection } from './settings-section';
import { SettingsToggleItem } from './settings-toggle-item';

interface Props {
  onNavigate: (screen: 'salary-info') => void;
}

export function SettingsScreen({ onNavigate }: Props) {
  const navigate = useUIStore((s) => s.navigate);

  const { data: version } = useQuery({
    queryKey: ['appVersion'],
    queryFn: getVersion,
    staleTime: Infinity,
  });

  const [autoStart, setAutoStart] = useState(false);

  return (
    <div className="bg-bg-primary flex h-full flex-col">
      <AppBar type="detail" title="설정" onBack={() => navigate('home')} />

      <div className="flex flex-col gap-5 overflow-y-auto p-4">
        <SettingsSection title="내 정보">
          <SettingsNavItem
            label="월급 · 근무 정보"
            onClick={() => onNavigate('salary-info')}
          />
        </SettingsSection>

        <SettingsSection title="앱 정보 및 도움말">
          <SettingsInfoItem label="버전 정보" value={version ?? '-'} />
          <SettingsNavItem label="문의하기" disabled />
        </SettingsSection>

        <SettingsSection title="자동 실행">
          <SettingsToggleItem
            label="로그인 시 MOA 자동 실행"
            value={autoStart}
            onChange={setAutoStart}
            disabled
          />
        </SettingsSection>

        <SettingsSection title="위험 영역">
          <ResetDataButton />
        </SettingsSection>
      </div>
    </div>
  );
}
