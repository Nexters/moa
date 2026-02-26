import { useQueryClient } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

import { UpdateAlertDialog } from '~/lib/check-for-updates';
import { commands } from '~/lib/tauri-bindings';
import { userSettingsQuery } from '~/queries';
import { router } from '~/router';

export function RootLayout() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void commands.initMenubar();
  }, []);

  useEffect(() => {
    const cleanListen = listen('menubar_panel_did_open', () => {
      const currentPath = router.state.location.pathname;
      if (!currentPath.startsWith('/onboarding')) {
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
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#343639',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            fontSize: '14px',
            lineHeight: '21px',
            letterSpacing: '-0.2px',
            fontWeight: 500,
            justifyContent: 'center',
          },
        }}
      />
    </>
  );
}
