import { type ErrorComponentProps } from '@tanstack/react-router';
import { relaunch } from '@tauri-apps/plugin-process';
import { usePostHog } from 'posthog-js/react';

import { openContactEmail } from '~/lib/contact';
import { AppFooter, Button } from '~/ui';

export function ErrorScreen({ error }: ErrorComponentProps) {
  const posthog = usePostHog();
  posthog.captureException(error);

  const handleContactUs = async () => {
    try {
      await openContactEmail(__APP_VERSION__);
    } catch (err) {
      posthog.captureException(err);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-32">
        <h1 className="t2-700 text-text-high text-center">
          앗, 문제가 생겼어요
        </h1>
        <p className="b1-400 text-text-medium mt-3 text-center">
          재시작하면 대부분 해결돼요.
          <br />
          같은 문제가 계속되면 알려 주세요.
        </p>

        <AppFooter className="flex-col-reverse">
          <Button
            autoFocus
            rounded="full"
            size="lg"
            className="w-60"
            onClick={() => relaunch()}
          >
            앱 재시작하기
          </Button>
          <Button variant="link" size="flat" onClick={handleContactUs}>
            문의하기
          </Button>
        </AppFooter>
      </div>
    </main>
  );
}
