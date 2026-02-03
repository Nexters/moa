import { useState } from 'react';

import { EditSalaryScreen } from './screens/edit-salary-screen';
import { EditScheduleScreen } from './screens/edit-schedule-screen';
import { SalaryInfoScreen } from './screens/salary-info-screen';
import { SettingsScreen } from './screens/settings-screen';

type SettingsRoute = 'main' | 'salary-info' | 'edit-salary' | 'edit-schedule';

export function Settings() {
  const [currentScreen, setCurrentScreen] = useState<SettingsRoute>('main');

  switch (currentScreen) {
    case 'main':
      return <SettingsScreen onNavigate={setCurrentScreen} />;
    case 'salary-info':
      return (
        <SalaryInfoScreen
          onBack={() => setCurrentScreen('main')}
          onNavigate={setCurrentScreen}
        />
      );
    case 'edit-salary':
      return (
        <EditSalaryScreen onBack={() => setCurrentScreen('salary-info')} />
      );
    case 'edit-schedule':
      return (
        <EditScheduleScreen onBack={() => setCurrentScreen('salary-info')} />
      );
  }
}
