import { useUIStore } from '~/stores/ui-store';
import { AppBar } from '~/ui/app-bar';

import { useHomeScreen } from './hooks/use-home-screen';
import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { DayOffScreen } from './screens/day-off-screen';
import { PostCompletedScreen } from './screens/post-completed-screen';
import { VacationScreen } from './screens/vacation-screen';
import { WorkingScreen } from './screens/working-screen';

export function Home() {
  const navigate = useUIStore((s) => s.navigate);
  const { isLoading, mainScreen } = useHomeScreen();

  if (isLoading || !mainScreen) return null;

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="main" onSettings={() => navigate('settings')} />
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
