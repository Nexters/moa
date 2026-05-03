import { useState } from 'react';

import { useIsPayday } from '~/hooks/use-is-payday';
import { useUserSettings } from '~/hooks/use-user-settings';
import { posthog } from '~/lib/analytics';
import { assertOnboarded, commands } from '~/lib/tauri-bindings';
import { IconButton } from '~/ui/icon-button';
import { CelebrationIcon } from '~/ui/icons';
import { TooltipBubble } from '~/ui/tooltip-bubble';

import { PaydayOverlay } from './payday-overlay';

export function CelebrateButton() {
  const { data: settings } = useUserSettings();
  const isPayday = useIsPayday(settings?.payDay ?? 25);
  const [showOverlay, setShowOverlay] = useState(false);

  if (!isPayday || !settings) return null;

  assertOnboarded(settings);

  const handleClick = () => {
    void commands
      .showConfettiWindow()
      .then((result) => {
        if (result.status === 'error') {
          posthog.captureException(new Error(result.error));
        }
      })
      .catch((error: unknown) => {
        posthog.captureException(
          error instanceof Error ? error : new Error(String(error)),
        );
      });
    setShowOverlay(true);
  };

  return (
    <>
      <div className="relative">
        <IconButton
          className="animate-wiggle"
          data-attr="월급날_축하_클릭"
          onClick={handleClick}
          aria-label="월급날 축하"
        >
          <CelebrationIcon />
        </IconButton>
        <div className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2">
          <TooltipBubble size="sm" placement="top">
            눌러보세요!
          </TooltipBubble>
        </div>
      </div>

      {showOverlay && (
        <PaydayOverlay
          salaryAmount={settings.salaryAmount}
          salaryType={settings.salaryType}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </>
  );
}
