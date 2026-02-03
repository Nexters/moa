import { useState, type ComponentType } from 'react';

import { CompletionScreen } from '../screens/completion-screen';
import { SalaryScreen } from '../screens/salary-screen';
import { ScheduleScreen } from '../screens/schedule-screen';
import { WelcomeScreen } from '../screens/welcome-screen';
import type { OnboardingForm } from './use-onboarding-form';

export type OnboardingScreen = 'welcome' | 'salary' | 'schedule' | 'completion';

const SCREEN_ORDER: OnboardingScreen[] = [
  'welcome',
  'salary',
  'schedule',
  'completion',
];

/** 모든 온보딩 화면이 받는 공통 Props */
export interface OnboardingScreenProps {
  form: OnboardingForm;
  onNext: () => void;
  onBack: () => void;
  isFirstScreen: boolean;
  isLastScreen: boolean;
}

/** 화면별 컴포넌트 매핑 */
const SCREEN_COMPONENTS: Record<
  OnboardingScreen,
  ComponentType<OnboardingScreenProps>
> = {
  welcome: WelcomeScreen,
  salary: SalaryScreen,
  schedule: ScheduleScreen,
  completion: CompletionScreen,
};

export function useOnboardingScreen() {
  const [currentScreen, setCurrentScreen] =
    useState<OnboardingScreen>('welcome');

  const currentStep = SCREEN_ORDER.indexOf(currentScreen);
  const totalSteps = SCREEN_ORDER.length;

  const isFirstScreen = currentStep === 0;
  const isLastScreen = currentStep === totalSteps - 1;

  const goToNext = () => {
    const nextIndex = currentStep + 1;
    if (nextIndex < totalSteps) {
      setCurrentScreen(SCREEN_ORDER[nextIndex]);
    }
  };

  const goToPrevious = () => {
    const prevIndex = currentStep - 1;
    if (prevIndex >= 0) {
      setCurrentScreen(SCREEN_ORDER[prevIndex]);
    }
  };

  return {
    currentScreen,
    currentStep,
    totalSteps,
    goToNext,
    goToPrevious,
    isFirstScreen,
    isLastScreen,
    CurrentScreen: SCREEN_COMPONENTS[currentScreen],
  };
}
