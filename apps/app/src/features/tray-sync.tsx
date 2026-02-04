import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
import { useTrayIconSync } from '~/hooks/use-tray-icon-sync';
import { useTrayTitleSync } from '~/hooks/use-tray-title-sync';
import { useUserSettings } from '~/hooks/use-user-settings';

/**
 * 전역 Tray 동기화 컴포넌트
 *
 * - 현재 라우트와 무관하게 tray 아이콘/타이틀 동기화 유지
 * - TanStack Query 캐시를 구독하여 설정 변경 시 자동 반영
 * - onboardingCompleted 체크로 Onboarding 중에는 interval 미실행
 */
export function TraySync() {
  const { data: settings } = useUserSettings();
  const salaryInfo = useSalaryCalculator(settings ?? null);

  const isWorking = salaryInfo ? salaryInfo.workStatus === 'working' : null;
  useTrayIconSync(isWorking);

  useTrayTitleSync(
    salaryInfo?.todayEarnings ?? null,
    settings?.showMenubarSalary ?? true,
  );

  return null;
}
