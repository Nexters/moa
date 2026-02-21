import { createFileRoute } from '@tanstack/react-router';

import { SalaryScreen } from '~/features/onboarding/screens/salary-screen';

export const Route = createFileRoute('/onboarding/salary')({
  component: SalaryScreen,
});
