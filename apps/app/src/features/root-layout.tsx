import { useQueryClient } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef } from 'react';

import { UpdateAlertDialog } from '~/lib/check-for-updates';
import { commands } from '~/lib/tauri-bindings';
import { userSettingsQuery } from '~/queries';
import { router } from '~/router';
import { AppToaster } from '~/ui';

export function RootLayout() {
  const queryClient = useQueryClient();
  const pendingNavRef = useRef<string | null>(null);

  useEffect(() => {
    void commands.initMenubar();
  }, []);

  useEffect(() => {
    const unlisten = listen('open-salary-settings', () => {
      pendingNavRef.current = '/settings/salary-info';
      void router.navigate({ to: '/settings/salary-info' });
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const cleanListen = listen('menubar_panel_did_open', () => {
      const currentPath = router.state.location.pathname;
      if (pendingNavRef.current) {
        void router.navigate({ to: pendingNavRef.current });
        pendingNavRef.current = null;
      } else if (
        !currentPath.startsWith('/onboarding') &&
        !currentPath.startsWith('/login')
      ) {
        // /login 에서는 useSocialLogin onSuccess가 needsOnboarding 여부에 따라
        // /onboarding/salary 또는 /home 으로 라우팅하므로 강제 이동 금지.
        // 그렇지 않으면 로그인 직후 panel did open 이 /home → guard → /login 로 race 발생.
        void router.navigate({ to: '/home' });
      }
      (document.activeElement as HTMLElement)?.blur();
    });
    return () => {
      void cleanListen.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const unlisten = listen('user-settings-changed', () => {
      void queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [queryClient]);

  // 패널 열릴 때 서버 데이터 sync (fire-and-forget)
  useEffect(() => {
    const unlisten = listen('panel-shown', () => {
      void commands.syncFromServer();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <>
      <Outlet />
      <UpdateAlertDialog />
      <AppToaster />
    </>
  );
}
