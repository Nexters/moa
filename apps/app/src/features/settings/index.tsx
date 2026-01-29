import { useState } from 'react';

import { SalaryInfoScreen } from './salary-info-screen';
import { SettingsScreen } from './settings-screen';

type SettingsRoute = 'main' | 'salary-info';

export function Settings() {
  const [currentScreen, setCurrentScreen] = useState<SettingsRoute>('main');

  switch (currentScreen) {
    case 'main':
      return <SettingsScreen onNavigate={setCurrentScreen} />;
    case 'salary-info':
      return <SalaryInfoScreen onBack={() => setCurrentScreen('main')} />;
  }
}
