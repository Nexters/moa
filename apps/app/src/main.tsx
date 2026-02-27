import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { PostHogProvider } from 'posthog-js/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { posthog, subscribeAnalytics } from './lib/analytics';
import { queryClient } from './lib/query-client';
import { router } from './router';
import './global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

if (getCurrentWindow().label === 'confetti') {
  void import('./features/confetti/confetti-overlay').then(
    ({ ConfettiOverlay }) => {
      root.render(
        <React.StrictMode>
          <ConfettiOverlay />
        </React.StrictMode>,
      );
    },
  );
} else {
  subscribeAnalytics(router);

  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <PostHogProvider client={posthog}>
          <RouterProvider router={router} />
        </PostHogProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
