import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router';

import { posthog } from '~/lib/analytics';
import { commands, unwrapResult } from '~/lib/tauri-bindings';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      const isCompleted = unwrapResult(await commands.isOnboardingCompleted());
      throw redirect({ to: isCompleted ? '/home' : '/onboarding/welcome' });
    } catch (e) {
      if (isRedirect(e)) throw e;
      posthog.captureException(e);
      throw redirect({ to: '/onboarding/welcome' });
    }
  },
});
