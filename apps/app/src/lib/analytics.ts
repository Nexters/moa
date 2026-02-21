import posthog from 'posthog-js';

import type { router } from '~/router';

import { getScreenName } from './analytics-screens';

type Router = typeof router;

posthog.init('phc_Vi1if06zeH3nYTze3n3mTXnWMZcd0cTCHiE9kK1kBKs', {
  api_host: 'https://us.i.posthog.com',
  capture_pageview: false,
  capture_pageleave: false,
  persistence: 'localStorage',
});

export { posthog };

export function subscribeAnalytics(r: Router): () => void {
  return r.subscribe(
    'onResolved',
    ({ fromLocation, toLocation, pathChanged }) => {
      if (!pathChanged) return;

      if (fromLocation) {
        const prevScreen = getScreenName(fromLocation.pathname);
        posthog.capture('$pageleave', { screen: prevScreen });
      }

      const screen = getScreenName(toLocation.pathname);
      posthog.register({ screen });
      posthog.capture('$pageview', { screen });
    },
  );
}
