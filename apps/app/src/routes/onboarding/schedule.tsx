import { createFileRoute } from '@tanstack/react-router';

import { ScheduleScreen } from '~/features/onboarding/screens/schedule-screen';

export const Route = createFileRoute('/onboarding/schedule')({
  component: ScheduleScreen,
});
