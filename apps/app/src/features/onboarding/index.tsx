import { Outlet } from '@tanstack/react-router';
import { createContext, useContext } from 'react';

import {
  useOnboardingForm,
  type OnboardingForm,
} from './hooks/use-onboarding-form';
import { useOnboardingNavigation } from './hooks/use-onboarding-screen';

interface OnboardingContextValue {
  form: OnboardingForm;
  goToNext: () => void;
  goToPrevious: () => void;
  isFirstScreen: boolean;
  isLastScreen: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error(
      'useOnboardingContext must be used within OnboardingLayout',
    );
  }
  return ctx;
}

export function OnboardingLayout() {
  const { goToNext, goToPrevious, isFirstScreen, isLastScreen } =
    useOnboardingNavigation();

  const form = useOnboardingForm({ onSuccess: goToNext });

  return (
    <OnboardingContext
      value={{ form, goToNext, goToPrevious, isFirstScreen, isLastScreen }}
    >
      <Outlet />
    </OnboardingContext>
  );
}
