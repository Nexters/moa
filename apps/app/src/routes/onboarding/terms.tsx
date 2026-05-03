import { createFileRoute } from '@tanstack/react-router';

import { TermsScreen } from '~/features/onboarding/screens/terms-screen';

export const Route = createFileRoute('/onboarding/terms')({
  component: TermsScreen,
});
