import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { CelebrateButton } from '~/features/confetti/celebrate-button';
import {
  waitForNextSalaryTick,
  waitForSalaryTick,
} from '~/hooks/use-salary-tick';
import { useTodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { useTodayWorkStatus } from '~/hooks/use-today-work-status';
import { AppBar } from '~/ui/app-bar';

import { useHomeScreen } from './hooks/use-home-screen';
import { AdjustTodayScheduleScreen } from './screens/adjust-today-schedule-screen';
import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { DayOffScreen } from './screens/day-off-screen';
import { ExtendWorkScreen } from './screens/extend-work-screen';
import { PostCompletedScreen } from './screens/post-completed-screen';
import { WorkingScreen } from './screens/working-screen';

type AdjustMode = null | 'before-work' | 'working' | 'completed';

export function Home() {
  const navigate = useNavigate();
  const [adjustMode, setAdjustMode] = useState<AdjustMode>(null);
  const [isExtendingWork, setIsExtendingWork] = useState(false);
  const { isLoading, mainScreen } = useHomeScreen();
  const { saveSchedule, clearSchedule } = useTodayWorkSchedule();
  const { saveStatus, clearStatus } = useTodayWorkStatus();

  useEffect(() => {
    if (!mainScreen) return;
    if (adjustMode === 'before-work' && mainScreen.screen !== 'before-work') {
      setAdjustMode(null);
    }
    if (adjustMode === 'working' && mainScreen.screen !== 'working') {
      setAdjustMode(null);
    }
    if (adjustMode === 'completed' && mainScreen.screen !== 'completed') {
      setAdjustMode(null);
    }
    if (isExtendingWork && mainScreen.screen !== 'completed') {
      setIsExtendingWork(false);
    }
  }, [adjustMode, isExtendingWork, mainScreen]);

  if (isLoading || !mainScreen) return null;

  if (adjustMode === 'before-work' && mainScreen.screen === 'before-work') {
    return (
      <AdjustTodayScheduleScreen
        settings={mainScreen.settings}
        todaySchedule={mainScreen.todaySchedule}
        isPending={mainScreen.isPending}
        showStatusOptions
        onBack={() => setAdjustMode(null)}
        onSave={async (startTime, endTime) => {
          await Promise.all([clearStatus(), saveSchedule(startTime, endTime)]);
          await waitForNextSalaryTick();
        }}
        onSaveStatus={async (status) => {
          await Promise.all([saveStatus(status), clearSchedule()]);
          await waitForSalaryTick((info) => info.workStatus === status);
        }}
      />
    );
  }

  if (adjustMode === 'working' && mainScreen.screen === 'working') {
    return (
      <AdjustTodayScheduleScreen
        settings={mainScreen.settings}
        todaySchedule={mainScreen.todaySchedule}
        isPending={mainScreen.isPending}
        showStatusOptions
        onBack={() => setAdjustMode(null)}
        onSave={async (startTime, endTime) => {
          await Promise.all([clearStatus(), saveSchedule(startTime, endTime)]);
          await waitForNextSalaryTick();
        }}
        onSaveStatus={async (status) => {
          await Promise.all([saveStatus(status), clearSchedule()]);
          await waitForSalaryTick((info) => info.workStatus === status);
        }}
      />
    );
  }

  if (adjustMode === 'completed' && mainScreen.screen === 'completed') {
    return (
      <AdjustTodayScheduleScreen
        settings={mainScreen.settings}
        todaySchedule={mainScreen.todaySchedule}
        isPending={mainScreen.isPending}
        onBack={() => setAdjustMode(null)}
        onSave={mainScreen.onAdjustSchedule}
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
            onAdjustWorkTime={() => setAdjustMode('before-work')}
          />
        )}
        {mainScreen.screen === 'working' && (
          <WorkingScreen
            {...mainScreen}
            onAdjustWorkTime={() => setAdjustMode('working')}
          />
        )}
        {mainScreen.screen === 'completed' && (
          <CompletedScreen
            settings={mainScreen.settings}
            salaryInfo={mainScreen.salaryInfo}
            todaySchedule={mainScreen.todaySchedule}
            isPending={mainScreen.isPending}
            onAcknowledge={mainScreen.onAcknowledge}
            onAdjustWorkTime={() => setAdjustMode('completed')}
            onExtendWork={() => setIsExtendingWork(true)}
          />
        )}
        {mainScreen.screen === 'post-completed' && (
          <PostCompletedScreen {...mainScreen} />
        )}
      </div>
    </main>
  );
}
