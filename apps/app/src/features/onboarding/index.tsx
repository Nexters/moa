import { useOnboardingForm } from './hooks/use-onboarding-form';
import { useOnboardingScreen } from './hooks/use-onboarding-screen';

export function Onboarding() {
  const form = useOnboardingForm();
  const { CurrentScreen, screenProps } = useOnboardingScreen({ form });

  return <CurrentScreen {...screenProps} />;
}
