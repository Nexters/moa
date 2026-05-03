import { createFileRoute } from '@tanstack/react-router';

import { EditNicknameScreen } from '~/features/settings/screens/edit-nickname-screen';

export const Route = createFileRoute('/settings/edit-nickname')({
  component: EditNicknameScreen,
});
