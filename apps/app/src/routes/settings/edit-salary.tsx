import { createFileRoute } from '@tanstack/react-router';

import { EditSalaryScreen } from '~/features/settings/screens/edit-salary-screen';

export const Route = createFileRoute('/settings/edit-salary')({
  component: EditSalaryScreen,
});
