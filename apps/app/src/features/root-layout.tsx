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
      } else if (!currentPath.startsWith('/onboarding')) {
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

  return (
    <>
      <Outlet />
      <UpdateAlertDialog />
      <AppToaster />
    </>
  );
}
