import { useState, type ComponentType } from 'react';

import { CompletionScreen } from '../completion-screen';
import { SalaryScreen } from '../salary-screen';
import { ScheduleScreen } from '../schedule-screen';
import { WelcomeScreen } from '../welcome-screen';
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
  onComplete: () => void;
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

interface UseOnboardingScreenOptions {
  form: OnboardingForm;
  onComplete: () => void;
}

export function useOnboardingScreen({
  form,
  onComplete,
}: UseOnboardingScreenOptions) {
  const [currentScreen, setCurrentScreen] =
    useState<OnboardingScreen>('welcome');

  const currentStep = SCREEN_ORDER.indexOf(currentScreen);
  const totalSteps = SCREEN_ORDER.length;

  const isFirstScreen = currentStep === 0;
  const isLastScreen = currentStep === totalSteps - 1;
  const canGoBack = !isFirstScreen;

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

  const goToScreen = (screen: OnboardingScreen) => {
    setCurrentScreen(screen);
  };

  return {
    // 현재 화면 정보 (디버깅/조건부 로직용)
    currentScreen,
    currentStep,
    totalSteps,

    // 네비게이션 (직접 호출 필요 시)
    goToNext,
    goToPrevious,
    goToScreen,

    // 상태 플래그
    isFirstScreen,
    isLastScreen,
    canGoBack,

    // 렌더링용
    CurrentScreen: SCREEN_COMPONENTS[currentScreen],
    screenProps: {
      form,
      onNext: goToNext,
      onBack: goToPrevious,
      onComplete,
      isFirstScreen,
      isLastScreen,
    } satisfies OnboardingScreenProps,
  };
}
