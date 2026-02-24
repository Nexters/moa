import { type ErrorComponentProps } from '@tanstack/react-router';
import { relaunch } from '@tauri-apps/plugin-process';
import { usePostHog } from 'posthog-js/react';

import { AppFooter, Button, HeroIcon } from '~/ui';

export function ErrorScreen({ error }: ErrorComponentProps) {
  const posthog = usePostHog();
  posthog.captureException(error);

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center px-6 pt-16">
        <HeroIcon variant="empty" className="size-[120px]" />

        <h1 className="t2-700 text-text-high mt-6 text-center">
          오류가 발생되었어요
        </h1>

        <p className="b1-400 text-text-medium mt-3 text-center">
          문제가 지속되면 앱을 재시작해 주세요.
        </p>
      </div>

      <AppFooter>
        <Button
          rounded="full"
          size="lg"
          className="w-60"
          onClick={() => relaunch()}
        >
          앱 재시작하기
        </Button>
      </AppFooter>
    </main>
  );
}
