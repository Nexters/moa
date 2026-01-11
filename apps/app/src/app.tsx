import { useEffect } from 'react';

import './app.css';
import { checkForUpdates } from './lib/check-for-updates';

export function App() {
  useEffect(() => {
    // Check for updates 5 seconds after app loads
    const updateTimer = setTimeout(checkForUpdates, 5000);
    return () => clearTimeout(updateTimer);
  }, []);

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden rounded-xl">
      <h1>Welcome to Tauri + React</h1>
    </main>
  );
}
