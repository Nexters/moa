import { createFileRoute } from '@tanstack/react-router';

import { LoginScreen } from '~/features/auth/screens/login-screen';

export const Route = createFileRoute('/login')({
  component: LoginScreen,
  validateSearch: (
    search: Record<string, unknown>,
  ): { returnTo?: string } => {
    return typeof search.returnTo === 'string'
      ? { returnTo: search.returnTo }
      : {};
  },
});
