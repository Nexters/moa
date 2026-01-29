import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useVacation } from '~/hooks/use-vacation';
import { useUIStore } from '~/stores/ui-store';
import { AppBar } from '~/ui/app-bar';

import { BeforeWorkScreen } from './screens/before-work-screen';
import { CompletedScreen } from './screens/completed-screen';
import { WorkingScreen } from './screens/working-screen';

export function Home() {
  const { data: settings, isLoading } = useUserSettings();
  const navigate = useUIStore((s) => s.navigate);
  const salaryInfo = useSalaryCalculator(settings ?? null);
  const {
    isOnVacation,
    isLoading: vacationLoading,
    setVacation,
  } = useVacation();

  if (isLoading || vacationLoading || !settings || !salaryInfo) {
    return null;
  }

  const handleClose = () => {
    // 팝오버 닫기 또는 다른 동작을 위한 핸들러
    // 현재는 placeholder
  };

  const handleVacation = () => {
    void setVacation();
  };

  const renderScreen = () => {
    // 휴가 우선 체크
    if (isOnVacation || salaryInfo.workStatus === 'day-off') {
      return (
        <BeforeWorkScreen
          settings={settings}
          salaryInfo={salaryInfo}
          isDayOff
          onVacation={handleVacation}
          onClose={handleClose}
        />
      );
    }

    switch (salaryInfo.workStatus) {
      case 'before-work':
        return (
          <BeforeWorkScreen
            settings={settings}
            salaryInfo={salaryInfo}
            onVacation={handleVacation}
            onClose={handleClose}
          />
        );
      case 'working':
        return <WorkingScreen settings={settings} salaryInfo={salaryInfo} />;
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
