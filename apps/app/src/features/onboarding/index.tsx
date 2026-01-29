import { useOnboardingForm } from './hooks/use-onboarding-form';
import { useOnboardingScreen } from './hooks/use-onboarding-screen';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const form = useOnboardingForm();
  const { CurrentScreen, screenProps } = useOnboardingScreen({
    form,
    onComplete,
  });

  return <CurrentScreen {...screenProps} />;
}
