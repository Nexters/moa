import { toast } from 'sonner';

import { useIsPayday } from '~/hooks/use-is-payday';
import { useUserSettings } from '~/hooks/use-user-settings';
import { commands } from '~/lib/tauri-bindings';

import { IconButton } from './icon-button';
import { CelebrationIcon } from './icons';

export function CelebrateButton() {
  const { data: settings } = useUserSettings();
  const isPayday = useIsPayday(settings?.payDay ?? 25);

  if (!isPayday) return null;

  const handleClick = () => {
    void commands.showConfettiWindow();
    toast('월급날 축하해요! 🎉', { duration: 3000 });
  };

  return (
    <IconButton
      data-attr="월급날_축하_클릭"
      onClick={handleClick}
      aria-label="월급날 축하"
    >
      <CelebrationIcon />
    </IconButton>
  );
}
