import { useNavigate, useRouterState } from '@tanstack/react-router';

const SCREEN_ORDER = [
  '/onboarding/welcome',
  '/onboarding/salary',
  '/onboarding/schedule',
  '/onboarding/completion',
] as const;

export function useOnboardingNavigation() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const currentStep = SCREEN_ORDER.indexOf(
    pathname as (typeof SCREEN_ORDER)[number],
  );
  const totalSteps = SCREEN_ORDER.length;
  const isFirstScreen = currentStep <= 0;
  const isLastScreen = currentStep === totalSteps - 1;

  const goToNext = () => {
    const nextIndex = currentStep + 1;
    if (nextIndex < totalSteps) {
      void navigate({ to: SCREEN_ORDER[nextIndex] });
    }
  };

  const goToPrevious = () => {
    const prevIndex = currentStep - 1;
    if (prevIndex >= 0) {
      void navigate({ to: SCREEN_ORDER[prevIndex] });
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
