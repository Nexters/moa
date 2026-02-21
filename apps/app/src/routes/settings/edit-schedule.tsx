import { createFileRoute } from '@tanstack/react-router';

import { EditScheduleScreen } from '~/features/settings/screens/edit-schedule-screen';

export const Route = createFileRoute('/settings/edit-schedule')({
  component: EditScheduleScreen,
});
