import { createFileRoute } from '@tanstack/react-router';

import { WithdrawalScreen } from '~/features/settings/screens/withdrawal-screen';

export const Route = createFileRoute('/settings/withdrawal')({
  component: WithdrawalScreen,
});
