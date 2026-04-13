import { createFileRoute } from '@tanstack/react-router';

import { TermsPolicyScreen } from '~/features/settings/screens/terms-policy-screen';

export const Route = createFileRoute('/settings/terms-policy')({
  component: TermsPolicyScreen,
});
