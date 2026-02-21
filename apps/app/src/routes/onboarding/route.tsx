import { createFileRoute } from '@tanstack/react-router';

import { OnboardingLayout } from '~/features/onboarding';

export const Route = createFileRoute('/onboarding')({
  component: OnboardingLayout,
});
