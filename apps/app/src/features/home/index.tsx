import { useState } from 'react';

import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
import { useTodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useVacation } from '~/hooks/use-vacation';
import { useUIStore } from '~/stores/ui-store';
import { AppBar } from '~/ui/app-bar';

import { AdjustWorkTimeScreen } from './screens/adjust-work-time-screen';
import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { HolidayScreen } from './screens/holiday-screen';
import { WorkingScreen } from './screens/working-screen';

type HomeScreen = 'main' | 'adjust-work-time';

export function Home() {
  const [currentScreen, setCurrentScreen] = useState<HomeScreen>('main');
  const { data: settings, isLoading } = useUserSettings();
  const navigate = useUIStore((s) => s.navigate);
  const {
    schedule: todaySchedule,
    isLoading: scheduleLoading,
    saveSchedule,
  } = useTodayWorkSchedule();
  const salaryInfo = useSalaryCalculator(settings ?? null, todaySchedule);
  const {
    isOnVacation,
    isLoading: vacationLoading,
    setVacation,
    clearVacation,
  } = useVacation();

  if (
    isLoading ||
    vacationLoading ||
    scheduleLoading ||
    !settings ||
    !salaryInfo
  ) {
    return null;
  }

  const handleClose = () => {
    // 팝오버 닫기 또는 다른 동작을 위한 핸들러
    // 현재는 placeholder
  };

  const handleTodayWork = () => {
    clearVacation();
    setCurrentScreen('adjust-work-time');
  };

  const handleVacation = () => {
    setVacation();
  };

  const handleStartWork = () => {
    setCurrentScreen('adjust-work-time');
  };

  const handleConfirmWorkTime = async (startTime: string, endTime: string) => {
    await saveSchedule(startTime, endTime);
    setCurrentScreen('main');
  };

  const handleBackFromAdjust = () => {
    setCurrentScreen('main');
  };

  // 시간 조정 화면
  if (currentScreen === 'adjust-work-time') {
    const defaultStart =
      todaySchedule?.workStartTime ?? settings.workStartTime ?? '09:00';
    const defaultEnd =
      todaySchedule?.workEndTime ?? settings.workEndTime ?? '18:00';

    return (
      <AdjustWorkTimeScreen
        defaultStartTime={defaultStart}
        defaultEndTime={defaultEnd}
        onConfirm={handleConfirmWorkTime}
        onBack={handleBackFromAdjust}
      />
    );
  }

  const renderScreen = () => {
    // 휴가 우선 체크
    if (isOnVacation || salaryInfo.workStatus === 'day-off') {
      return (
        <HolidayScreen salaryInfo={salaryInfo} onTodayWork={handleTodayWork} />
      );
    }

    switch (salaryInfo.workStatus) {
      case 'before-work':
        return (
          <BeforeWorkScreen
            settings={settings}
            salaryInfo={salaryInfo}
            todaySchedule={todaySchedule}
            onVacation={handleVacation}
            onStartWork={handleStartWork}
          />
        );
      case 'working':
        return (
          <WorkingScreen
            settings={settings}
            salaryInfo={salaryInfo}
            todaySchedule={todaySchedule}
          />
        );
      case 'completed':
        return (
          <CompletedScreen
            settings={settings}
            salaryInfo={salaryInfo}
            onClose={handleClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="main" onSettings={() => navigate('settings')} />
      <div className="flex flex-1 flex-col px-5 pt-3">{renderScreen()}</div>
    </main>
  );
}
