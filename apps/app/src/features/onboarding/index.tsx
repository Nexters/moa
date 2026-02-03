import { useOnboardingForm } from './hooks/use-onboarding-form';
import { useOnboardingScreen } from './hooks/use-onboarding-screen';

export function Onboarding() {
  const { CurrentScreen, goToNext, goToPrevious, isFirstScreen, isLastScreen } =
    useOnboardingScreen();

  const form = useOnboardingForm({ onSuccess: goToNext });

  return (
    <CurrentScreen
      form={form}
      onNext={goToNext}
      onBack={goToPrevious}
      isFirstScreen={isFirstScreen}
      isLastScreen={isLastScreen}
    />
  );
}
