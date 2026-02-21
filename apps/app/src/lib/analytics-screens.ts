import type { FileRouteTypes } from '~/routeTree.gen';

type RoutePath = FileRouteTypes['fullPaths'];

const SCREEN_NAMES: Record<RoutePath, string> = {
  '/': '초기화면',
  '/home': '홈',
  '/onboarding': '온보딩',
  '/onboarding/welcome': '온보딩 > 환영',
  '/onboarding/salary': '온보딩 > 급여정보',
  '/onboarding/schedule': '온보딩 > 근무일정',
  '/onboarding/completion': '온보딩 > 완료',
  '/settings/': '설정',
  '/settings/salary-info': '설정 > 급여정보',
  '/settings/edit-salary': '설정 > 급여수정',
  '/settings/edit-schedule': '설정 > 일정수정',
};

export function getScreenName(path: string): string {
  return SCREEN_NAMES[path as RoutePath] ?? path;
}
