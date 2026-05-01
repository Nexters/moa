import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router';

import { Home } from '~/features/home';
import { posthog } from '~/lib/analytics';
import { commands, unwrapResult } from '~/lib/tauri-bindings';

export const Route = createFileRoute('/home')({
  beforeLoad: async () => {
    try {
      const isCompleted = unwrapResult(await commands.isOnboardingCompleted());
      if (!isCompleted) throw redirect({ to: '/login' });
    } catch (e) {
      if (isRedirect(e)) throw e;
      posthog.captureException(e);
      throw redirect({ to: '/login' });
    }
  },
  component: Home,
});
