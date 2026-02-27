import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { useIsPayday } from '~/hooks/use-is-payday';
import { useUserSettings } from '~/hooks/use-user-settings';
import { commands } from '~/lib/tauri-bindings';
import { AppBar } from '~/ui/app-bar';

import { useHomeScreen } from './hooks/use-home-screen';
import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { DayOffScreen } from './screens/day-off-screen';
import { PostCompletedScreen } from './screens/post-completed-screen';
import { VacationScreen } from './screens/vacation-screen';
import { WorkingScreen } from './screens/working-screen';

export function Home() {
  const navigate = useNavigate();
  const { isLoading, mainScreen } = useHomeScreen();
  const { data: settings } = useUserSettings();
  const isPayday = useIsPayday(settings?.payDay ?? 25);

  if (isLoading || !mainScreen) return null;

  const handleCelebrate = () => {
    void commands.showConfettiWindow();
    toast('월급날 축하해요! 🎉', { duration: 3000 });
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar
        type="main"
        onSettings={() => navigate({ to: '/settings' })}
        onCelebrate={handleCelebrate}
        isPayday={isPayday}
      />
      <div className="flex flex-1 flex-col px-5 pt-3">
        {mainScreen.screen === 'vacation' && <VacationScreen {...mainScreen} />}
        {mainScreen.screen === 'day-off' && <DayOffScreen {...mainScreen} />}
        {mainScreen.screen === 'before-work' && (
          <BeforeWorkScreen {...mainScreen} />
        )}
        {mainScreen.screen === 'working' && <WorkingScreen {...mainScreen} />}
        {mainScreen.screen === 'completed' && (
          <CompletedScreen {...mainScreen} />
        )}
        {mainScreen.screen === 'post-completed' && (
          <PostCompletedScreen {...mainScreen} />
        )}
      </div>
    </main>
  );
}
