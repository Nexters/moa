import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { CelebrateButton } from '~/features/confetti/celebrate-button';
import { AppBar } from '~/ui/app-bar';

import { useHomeScreen } from './hooks/use-home-screen';
import { AdjustTodayScheduleScreen } from './screens/adjust-today-schedule-screen';
import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { DayOffScreen } from './screens/day-off-screen';
import { PostCompletedScreen } from './screens/post-completed-screen';
import { VacationScreen } from './screens/vacation-screen';
import { WorkingScreen } from './screens/working-screen';

export function Home() {
  const navigate = useNavigate();
  const [isAdjustingWorkTime, setIsAdjustingWorkTime] = useState(false);
  const { isLoading, mainScreen } = useHomeScreen();

  useEffect(() => {
    if (isAdjustingWorkTime && mainScreen?.screen !== 'working') {
      setIsAdjustingWorkTime(false);
    }
  }, [isAdjustingWorkTime, mainScreen?.screen]);

  if (isLoading || !mainScreen) return null;

  if (isAdjustingWorkTime && mainScreen.screen === 'working') {
    return (
      <AdjustTodayScheduleScreen
        screenState={mainScreen}
        onBack={() => setIsAdjustingWorkTime(false)}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <AppBar
        type="main"
        onSettings={() => navigate({ to: '/settings' })}
        actions={<CelebrateButton />}
      />
      <div className="flex flex-1 flex-col px-5 pt-3">
        {mainScreen.screen === 'vacation' && <VacationScreen {...mainScreen} />}
        {mainScreen.screen === 'day-off' && <DayOffScreen {...mainScreen} />}
        {mainScreen.screen === 'before-work' && (
          <BeforeWorkScreen {...mainScreen} />
        )}
        {mainScreen.screen === 'working' && (
          <WorkingScreen
            {...mainScreen}
            onAdjustWorkTime={() => setIsAdjustingWorkTime(true)}
          />
        )}
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
