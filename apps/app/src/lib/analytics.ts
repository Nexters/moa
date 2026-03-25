import { listen } from '@tauri-apps/api/event';
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

  // 초기 페이지뷰 — 라우터 구독 전 첫 로드를 커버
  const screen = window.location.pathname || '/';
  posthog.register({ screen });
  posthog.capture('$pageview', { screen });

  // 메뉴바 패널 숨김 시 이벤트 flush
  void listen('menubar_panel_did_resign_key', () => {
    posthog.flush();
  });

  // 앱 종료 시 이벤트 flush
  window.addEventListener('beforeunload', () => {
    posthog.flush();
  });
}

export { posthog };

export function subscribeAnalytics(r: Router): () => void {
  if (!import.meta.env.PROD) return () => {};
  let isInitialNavigation = true;
  return r.subscribe(
    'onResolved',
    ({ fromLocation, toLocation, pathChanged }) => {
      if (isInitialNavigation) {
        isInitialNavigation = false;
        return;
      }
      if (!pathChanged) return;

      if (fromLocation) {
        posthog.capture('$pageleave', { screen: fromLocation.pathname });
      }

      posthog.register({ screen: toLocation.pathname });
      posthog.capture('$pageview', { screen: toLocation.pathname });
    },
  );
}
