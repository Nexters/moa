import { createFileRoute } from '@tanstack/react-router';

import { WelcomeScreen } from '~/features/onboarding/screens/welcome-screen';

export const Route = createFileRoute('/onboarding/welcome')({
  component: WelcomeScreen,
});
