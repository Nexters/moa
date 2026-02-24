import {
  createRootRoute,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';

import { RootLayout } from '~/features/app';
import { commands } from '~/lib/tauri-bindings';
import { Button } from '~/ui';

function RootErrorBoundary({ error }: ErrorComponentProps) {
  const posthog = usePostHog();
  posthog.captureException(error);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-5">
      <p className="t2-400 text-text-medium">오류가 발생되었어요.</p>
      <Button
        rounded="full"
        size="md"
        className="w-60"
        onClick={() => commands.restartApp()}
      >
        앱 재시작하기
      </Button>
    </main>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorBoundary,
});
