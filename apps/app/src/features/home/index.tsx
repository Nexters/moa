import { useUIStore } from '~/stores/ui-store';
import { AppBar } from '~/ui/app-bar';

import { useHomeScreen } from './hooks/use-home-screen';
import { AdjustWorkTimeScreen } from './screens/adjust-work-time-screen';
import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { HolidayScreen } from './screens/holiday-screen';
import { PostCompletedScreen } from './screens/post-completed-screen';
import { WorkingScreen } from './screens/working-screen';

export function Home() {
  const navigate = useUIStore((s) => s.navigate);
  const { isLoading, mainScreen, adjustWorkTime } = useHomeScreen();

  if (isLoading || !mainScreen) return null;

  if (adjustWorkTime.isOpen) {
    return (
      <AdjustWorkTimeScreen
        defaultStartTime={adjustWorkTime.defaultStartTime}
        defaultEndTime={adjustWorkTime.defaultEndTime}
        onConfirm={adjustWorkTime.onConfirm}
        onBack={adjustWorkTime.onBack}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="main" onSettings={() => navigate('settings')} />
      <div className="flex flex-1 flex-col px-5 pt-3">
        {mainScreen.screen === 'holiday' && (
          <HolidayScreen
            salaryInfo={mainScreen.salaryInfo}
            onTodayWork={mainScreen.onTodayWork}
          />
        )}
        {mainScreen.screen === 'before-work' && (
          <BeforeWorkScreen
            settings={mainScreen.settings}
            salaryInfo={mainScreen.salaryInfo}
            todaySchedule={mainScreen.todaySchedule}
            onVacation={mainScreen.onVacation}
            onStartWork={mainScreen.onStartWork}
          />
        )}
        {mainScreen.screen === 'working' && (
          <WorkingScreen
            settings={mainScreen.settings}
            salaryInfo={mainScreen.salaryInfo}
            todaySchedule={mainScreen.todaySchedule}
          />
        )}
        {mainScreen.screen === 'completed' && (
          <CompletedScreen
            settings={mainScreen.settings}
            salaryInfo={mainScreen.salaryInfo}
            onClose={mainScreen.onClose}
          />
        )}
        {mainScreen.screen === 'post-completed' && (
          <PostCompletedScreen
            settings={mainScreen.settings}
            salaryInfo={mainScreen.salaryInfo}
            todaySchedule={mainScreen.todaySchedule}
            onAdjustSchedule={mainScreen.onAdjustSchedule}
          />
        )}
      </div>
    </main>
  );
}
