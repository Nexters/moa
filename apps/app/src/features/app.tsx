import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

import { UpdateAlertDialog } from '~/lib/check-for-updates';
import { commands, unwrapResult } from '~/lib/tauri-bindings';
import { useUIStore } from '~/stores/ui-store';

import { Home } from './home';
import { Onboarding } from './onboarding';
import { Settings } from './settings';
import './app.css';

export function App() {
  const currentRoute = useUIStore((s) => s.currentRoute);
  const navigate = useUIStore((s) => s.navigate);
  const resetToHome = useUIStore((s) => s.resetToHome);

  useEffect(() => {
    void commands.initMenubar();
  }, []);

  useEffect(() => {
    const cleanListen = listen('menubar_panel_did_open', () => {
      resetToHome();
      (document.activeElement as HTMLElement)?.blur();
    });
    return () => {
      void cleanListen.then((fn) => fn());
    };
  }, [resetToHome]);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const isCompleted = unwrapResult(
          await commands.isOnboardingCompleted(),
        );
        navigate(isCompleted ? 'home' : 'onboarding');
      } catch {
        // 에러 시 온보딩으로 시작
        navigate('onboarding');
      }
    };

    void checkOnboarding();
  }, [navigate]);

  const content = (() => {
    switch (currentRoute) {
      case 'loading':
        return null;
      case 'onboarding':
        return <Onboarding />;
      case 'home':
        return <Home />;
      case 'settings':
        return <Settings />;
    }
  })();

  return (
    <>
      {content}
      <UpdateAlertDialog />
    </>
  );
}
