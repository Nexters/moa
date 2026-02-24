import posthog from 'posthog-js';

import type { router } from '~/router';

type Router = typeof router;

if (import.meta.env.PROD) {
  posthog.init('phc_Vi1if06zeH3nYTze3n3mTXnWMZcd0cTCHiE9kK1kBKs', {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: false,
    persistence: 'localStorage',
  });
  posthog.register({ app_version: __APP_VERSION__ });
}

export { posthog };

export function subscribeAnalytics(r: Router): () => void {
  return r.subscribe(
    'onResolved',
    ({ fromLocation, toLocation, pathChanged }) => {
      if (!pathChanged) return;

      if (fromLocation) {
        posthog.capture('$pageleave', { screen: fromLocation.pathname });
      }

      posthog.register({ screen: toLocation.pathname });
      posthog.capture('$pageview', { screen: toLocation.pathname });
    },
  );
}
