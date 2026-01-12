import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

import { checkForUpdates } from './lib/check-for-updates';
import './app.css';

export function App() {
  useEffect(() => {
    // Check for updates 5 seconds after app loads
    const updateTimer = setTimeout(checkForUpdates, 5000);
    return () => clearTimeout(updateTimer);
  }, []);

  useEffect(() => {
    invoke('init');
  }, []);

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden rounded-xl">
      <h1>Welcome to Tauri + React</h1>
    </main>
  );
}
