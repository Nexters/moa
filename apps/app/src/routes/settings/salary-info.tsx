import { createFileRoute } from '@tanstack/react-router';

import { SalaryInfoScreen } from '~/features/settings/screens/salary-info-screen';

export const Route = createFileRoute('/settings/salary-info')({
  component: SalaryInfoScreen,
});
