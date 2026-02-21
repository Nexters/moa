import { createRootRoute } from '@tanstack/react-router';

import { RootLayout } from '~/features/app';

export const Route = createRootRoute({
  component: RootLayout,
});
