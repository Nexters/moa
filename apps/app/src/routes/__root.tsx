import { createRootRoute } from '@tanstack/react-router';

import { ErrorScreen } from '~/features/error-screen';
import { RootLayout } from '~/features/root-layout';

export const Route = createRootRoute({
  component: () => <ErrorScreen error={new Error('test')} reset={() => {}} />,
  errorComponent: ErrorScreen,
});
