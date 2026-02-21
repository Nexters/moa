import { listen } from '@tauri-apps/api/event';
import { Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';

import { UpdateAlertDialog } from '~/lib/check-for-updates';
import { commands } from '~/lib/tauri-bindings';
import { router } from '~/router';

import './app.css';

export function RootLayout() {
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

  return (
    <>
      <Outlet />
      <UpdateAlertDialog />
    </>
  );
}
