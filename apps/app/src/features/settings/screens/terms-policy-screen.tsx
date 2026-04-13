import { useNavigate } from '@tanstack/react-router';
import { openUrl } from '@tauri-apps/plugin-opener';

import { posthog } from '~/lib/analytics';
import { AppBar, InfoRow } from '~/ui';

const TERMS_ITEMS = [
  {
    label: '이용약관',
    url: 'https://moa-termsofservice.notion.site/304981fba5d4819286d1ee5712145f20',
  },
  {
    label: '개인정보 처리방침',
    url: 'https://moa-termsofservice.notion.site/304981fba5d481a5a845cf5b0da6c408',
  },
  {
    label: '마케팅 정보 수신 이용약관',
    url: 'https://moa-termsofservice.notion.site/304981fba5d48193a724cc49fec5f272',
  },
] as const;

export function TermsPolicyScreen() {
  const navigate = useNavigate();

  const handleOpenUrl = async (url: string) => {
    try {
      await openUrl(url);
    } catch (error) {
      posthog.captureException(error);
    }
  };

  return (
    <div className="bg-bg-primary flex h-full flex-col">
      <AppBar
        type="detail"
        title="약관 및 정책"
        onBack={() => navigate({ to: '/settings' })}
      />

      <div className="scrollbar-overlay flex min-h-0 flex-1 flex-col p-5">
        <div className="flex flex-col gap-2.5">
          {TERMS_ITEMS.map((item) => (
            <InfoRow
              key={item.label}
              as="button"
              label={item.label}
              onClick={() => handleOpenUrl(item.url)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
