import { useQueryClient } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef } from 'react';

import { UpdateAlertDialog } from '~/lib/check-for-updates';
import { commands, unwrapResult } from '~/lib/tauri-bindings';
import { authQuery, userSettingsQuery, workdayQuery } from '~/queries';
import { router } from '~/router';
import { AppToaster } from '~/ui';

export function RootLayout() {
  const queryClient = useQueryClient();
  const pendingNavRef = useRef<string | null>(null);

  useEffect(() => {
    void commands.initMenubar();
  }, []);

  useEffect(() => {
    const unlisten = listen('open-salary-settings', () => {
      pendingNavRef.current = '/settings/salary-info';
      void router.navigate({ to: '/settings/salary-info' });
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const cleanListen = listen('menubar_panel_did_open', async () => {
      if (pendingNavRef.current) {
        void router.navigate({ to: pendingNavRef.current });
        pendingNavRef.current = null;
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      // 패널이 열릴 때 인증/온보딩 상태로 결정적 라우팅.
      // mutation 콜백 race(useSocialLogin onSuccess vs panel did open)에 의존하지 않고,
      // 로그인 직후·재오픈 시점 모두 항상 옳은 화면으로 수렴시킨다.
      const currentPath = router.state.location.pathname;
      try {
        const auth = unwrapResult(await commands.getAuthStatus());
        if (auth.isLoggedIn) {
          const onboardingDone = unwrapResult(
            await commands.isOnboardingCompleted(),
          );
          if (!onboardingDone) {
            if (!currentPath.startsWith('/onboarding')) {
              void router.navigate({ to: '/onboarding/salary' });
            }
          } else if (
            !currentPath.startsWith('/onboarding') &&
            !currentPath.startsWith('/login')
          ) {
            void router.navigate({ to: '/home' });
          }
        }
        // 비로그인 상태는 / 와 /home 의 beforeLoad 가드가 /login 으로 보낸다.
      } catch {
        // 상태 조회 실패는 라우트 가드가 fallback 처리하므로 swallow
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

  // Workday cache 변경 알림 (mutate_workday 또는 fetch_workday 후 emit)
  useEffect(() => {
    const unlisten = listen<string>('workday-changed', (event) => {
      const date = event.payload;
      void queryClient.invalidateQueries({
        queryKey: workdayQuery.byDate(date),
      });
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [queryClient]);

  // 패널 열릴 때 서버 데이터 sync (fire-and-forget)
  useEffect(() => {
    const unlisten = listen('panel-shown', () => {
      void commands.syncFromServer();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  // 세션 만료(refresh 최종 실패) — 백엔드가 토큰 정리 후 emit. 로그인 화면으로.
  useEffect(() => {
    const unlisten = listen('auth_expired', () => {
      void queryClient.invalidateQueries({ queryKey: authQuery.all() });
      void router.navigate({ to: '/login' });
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [queryClient]);

  return (
    <>
      <Outlet />
      <UpdateAlertDialog />
      <AppToaster />
    </>
  );
}
