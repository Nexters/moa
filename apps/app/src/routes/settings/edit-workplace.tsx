import { createFileRoute } from '@tanstack/react-router';

import { EditWorkplaceScreen } from '~/features/settings/screens/edit-workplace-screen';

export const Route = createFileRoute('/settings/edit-workplace')({
  component: EditWorkplaceScreen,
});
