import { useNavigate, useRouterState } from '@tanstack/react-router';

import { useAuthStatus } from '~/hooks/use-auth';
import { useUserSettings } from '~/hooks/use-user-settings';

const SCREEN_ORDER = [
  '/onboarding/salary',
  '/onboarding/schedule',
  '/onboarding/completion',
] as const;

export function useOnboardingNavigation() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: authStatus } = useAuthStatus();
  const { data: userSettings } = useUserSettings();

  const currentStep = SCREEN_ORDER.indexOf(
    pathname as (typeof SCREEN_ORDER)[number],
  );
  const totalSteps = SCREEN_ORDER.length;
  const isFirstScreen = currentStep <= 0;
  const isLastScreen = currentStep === totalSteps - 1;

  const isLoggedIn = authStatus?.isLoggedIn === true;
  const termsAgreed = userSettings?.termsAgreed === true;

  const goToNext = () => {
    if (pathname === '/onboarding/schedule') {
      if (isLoggedIn && !termsAgreed) {
        void navigate({ to: '/onboarding/terms' });
      } else {
        void navigate({ to: '/onboarding/completion' });
      }
      return;
    }

    const nextIndex = currentStep + 1;
    if (nextIndex < totalSteps) {
      void navigate({ to: SCREEN_ORDER[nextIndex] });
    }
  };

  const goToPrevious = () => {
    if (pathname === '/onboarding/terms') {
      void navigate({ to: '/onboarding/schedule' });
      return;
    }

    const prevIndex = currentStep - 1;
    if (prevIndex >= 0) {
      void navigate({ to: SCREEN_ORDER[prevIndex] });
    } else {
      void navigate({ to: '/login' });
    }
  };

  return {
    currentStep,
    totalSteps,
    goToNext,
    goToPrevious,
    isFirstScreen,
    isLastScreen,
  };
}
