import { useState } from 'react';

import { useIsPayday } from '~/hooks/use-is-payday';
import { useUserSettings } from '~/hooks/use-user-settings';
import { assertOnboarded, commands } from '~/lib/tauri-bindings';
import { IconButton } from '~/ui/icon-button';
import { CelebrationIcon } from '~/ui/icons';

import { PaydayOverlay } from './payday-overlay';

export function CelebrateButton() {
  const { data: settings } = useUserSettings();
  const isPayday = useIsPayday(settings?.payDay ?? 25);
  const [showOverlay, setShowOverlay] = useState(false);

  if (!isPayday || !settings) return null;

  assertOnboarded(settings);

  const handleClick = () => {
    void commands.showConfettiWindow();
    setShowOverlay(true);
  };

  return (
    <>
      <IconButton
        className="animate-wiggle"
        data-attr="월급날_축하_클릭"
        onClick={handleClick}
        aria-label="월급날 축하"
      >
        <CelebrationIcon />
      </IconButton>

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
