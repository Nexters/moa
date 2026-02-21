import { createFileRoute, redirect } from '@tanstack/react-router';

import { commands, unwrapResult } from '~/lib/tauri-bindings';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      const isCompleted = unwrapResult(await commands.isOnboardingCompleted());
      throw redirect({ to: isCompleted ? '/home' : '/onboarding/welcome' });
    } catch (e) {
      if (e instanceof Error) {
        throw redirect({ to: '/onboarding/welcome' });
      }
      throw e;
    }
  },
});
