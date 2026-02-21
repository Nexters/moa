import { createFileRoute } from '@tanstack/react-router';

import { SettingsScreen } from '~/features/settings/screens/settings-screen';

export const Route = createFileRoute('/settings/')({
  component: SettingsScreen,
});
