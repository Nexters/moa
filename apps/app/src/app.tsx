import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

import { MenubarPanel } from './features/menubar/menubar-panel';
import { Onboarding } from './features/onboarding';
import { checkForUpdates } from './lib/check-for-updates';
import { commands, unwrapResult } from './lib/tauri-bindings';
import './app.css';

type AppState = 'loading' | 'onboarding' | 'main';

export function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    // Check for updates 5 seconds after app loads
    const updateTimer = setTimeout(checkForUpdates, 5000);
    return () => clearTimeout(updateTimer);
  }, []);

  useEffect(() => {
    void invoke('init');
  }, []);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const isCompleted = unwrapResult(
          await commands.isOnboardingCompleted(),
        );
        setAppState(isCompleted ? 'main' : 'onboarding');
      } catch {
        // 에러 시 온보딩으로 시작
        setAppState('onboarding');
      }
    };

    void checkOnboarding();
  }, []);

  const handleOnboardingComplete = () => {
    setAppState('main');
  };

  if (appState === 'loading') {
    return (
      <main className="flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-xl">
        <div className="text-gray-400">로딩 중...</div>
      </main>
    );
  }

  if (appState === 'onboarding') {
    return (
      <main className="flex h-screen w-full flex-col overflow-hidden rounded-xl">
        <Onboarding onComplete={handleOnboardingComplete} />
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-xl">
      <MenubarPanel />
    </main>
  );
}
