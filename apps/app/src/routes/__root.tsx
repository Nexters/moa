import { createRootRoute } from '@tanstack/react-router';

import { ErrorScreen, RootLayout } from '~/features/app';

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorScreen,
});
