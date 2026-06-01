import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { CelebrateButton } from '~/features/confetti/celebrate-button';
import {
  waitForNextSalaryTick,
  waitForSalaryTick,
} from '~/hooks/use-salary-tick';
import { useWorkday, type WorkdayStatus } from '~/hooks/use-workday';
import { AppBar } from '~/ui/app-bar';

import { useHomeScreen } from './hooks/use-home-screen';
import { AdjustTodayScheduleScreen } from './screens/adjust-today-schedule-screen';
import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { DayOffScreen } from './screens/day-off-screen';
import { ExtendWorkScreen } from './screens/extend-work-screen';
import { PostCompletedScreen } from './screens/post-completed-screen';
import { WorkingScreen } from './screens/working-screen';

export function Home() {
  const navigate = useNavigate();
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isExtendingWork, setIsExtendingWork] = useState(false);
  const { isLoading, mainScreen } = useHomeScreen();
  const { saveSchedule, saveStatus } = useWorkday();

  useEffect(() => {
    if (!mainScreen) return;
    if (isAdjusting && mainScreen.screen === 'non-working') {
      setIsAdjusting(false);
    }
    if (isExtendingWork && mainScreen.screen !== 'completed') {
      setIsExtendingWork(false);
    }
  }, [isAdjusting, isExtendingWork, mainScreen]);

  if (isLoading || !mainScreen) return null;

  const handleSaveSchedule = async (startTime: string, endTime: string) => {
    if (
      mainScreen.screen === 'completed' ||
      mainScreen.screen === 'post-completed'
    ) {
      await mainScreen.onAdjustSchedule(startTime, endTime);
    } else {
      await saveSchedule(startTime, endTime);
      await waitForNextSalaryTick();
    }
  };

  const handleSaveStatus = async (status: WorkdayStatus) => {
    await saveStatus(status);
    await waitForSalaryTick((info) => info.workStatus === status);
  };

  if (isAdjusting && mainScreen.screen !== 'non-working') {
    return (
      <AdjustTodayScheduleScreen
        settings={mainScreen.settings}
        todaySchedule={mainScreen.todaySchedule}
        isPending={'isPending' in mainScreen ? mainScreen.isPending : undefined}
        onBack={() => setIsAdjusting(false)}
        onSave={handleSaveSchedule}
        onSaveStatus={handleSaveStatus}
      />
    );
  }

  if (isExtendingWork && mainScreen.screen === 'completed') {
    return (
      <ExtendWorkScreen
        settings={mainScreen.settings}
        todaySchedule={mainScreen.todaySchedule}
        isPending={mainScreen.isPending}
        onBack={() => setIsExtendingWork(false)}
        onSubmit={mainScreen.onExtendWork}
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
        {mainScreen.screen === 'non-working' && (
          <DayOffScreen {...mainScreen} />
        )}
        {mainScreen.screen === 'before-work' && (
          <BeforeWorkScreen
            {...mainScreen}
            onAdjustWorkTime={() => setIsAdjusting(true)}
          />
        )}
        {mainScreen.screen === 'working' && (
          <WorkingScreen
            {...mainScreen}
            onAdjustWorkTime={() => setIsAdjusting(true)}
          />
        )}
        {mainScreen.screen === 'completed' && (
          <CompletedScreen
            settings={mainScreen.settings}
            salaryInfo={mainScreen.salaryInfo}
            todaySchedule={mainScreen.todaySchedule}
            isPending={mainScreen.isPending}
            onAcknowledge={mainScreen.onAcknowledge}
            onAdjustWorkTime={() => setIsAdjusting(true)}
            onExtendWork={() => setIsExtendingWork(true)}
          />
        )}
        {mainScreen.screen === 'post-completed' && (
          <PostCompletedScreen
            {...mainScreen}
            onAdjustWorkTime={() => setIsAdjusting(true)}
          />
        )}
      </div>
    </main>
  );
}
