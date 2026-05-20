import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { listen } from '@tauri-apps/api/event';
import Lottie from 'lottie-react';
import { useEffect, useRef, useState } from 'react';

import flyingMoneyAnimation from '~/assets/flying-money.json';
import { useSocialLogin } from '~/hooks/use-auth';
import type { AuthProvider, LoginResult } from '~/lib/tauri-bindings';
import { commands } from '~/lib/tauri-bindings';
import { userSettingsQuery } from '~/queries';
import { AppBar, Button } from '~/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/ui/alert-dialog';
import { AppleLogoIcon, KakaoLogoIcon, MoaLogoIcon } from '~/ui/icons';

const route = getRouteApi('/login');

export function LoginScreen() {
  const { returnTo } = route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socialLogin = useSocialLogin();

  const [lottieKey, setLottieKey] = useState(0);
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);
  const [retryLoginProvider, setRetryLoginProvider] =
    useState<AuthProvider | null>(null);
  const activeLoginRef = useRef<Promise<LoginResult> | null>(null);

  useEffect(() => {
    const cleanup = listen('menubar_panel_did_open', () => {
      setLottieKey((prev) => prev + 1);
    });
    return () => {
      void cleanup.then((fn) => fn());
    };
  }, []);

  const handleLoginSuccess = (result: LoginResult) => {
    if (result.needsOnboarding) {
      void navigate({ to: '/onboarding/salary' });
    } else {
      void queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
      void navigate({ to: returnTo ?? '/home' });
    }
  };

  const startSocialLogin = async (provider: AuthProvider) => {
    const loginPromise = socialLogin.mutateAsync(provider);
    activeLoginRef.current = loginPromise;

    try {
      const result = await loginPromise;
      handleLoginSuccess(result);
    } catch {
      // Error state is rendered from the mutation. Cancelled logins are reset in useSocialLogin.
    } finally {
      if (activeLoginRef.current === loginPromise) {
        activeLoginRef.current = null;
      }
    }
  };

  const handleSocialLogin = (provider: AuthProvider) => {
    if (socialLogin.isPending) {
      setRetryLoginProvider(provider);
      setIsRetryDialogOpen(true);
      return;
    }

    void startSocialLogin(provider);
  };

  const handleRetrySocialLogin = async () => {
    if (!retryLoginProvider) return;

    const provider = retryLoginProvider;
    setIsRetryDialogOpen(false);
    setRetryLoginProvider(null);
    await commands.cancelSocialLogin();
    await activeLoginRef.current?.catch(() => undefined);
    socialLogin.reset();
    void startSocialLogin(provider);
  };

  const handleGuestStart = () => {
    void navigate({ to: '/onboarding/salary' });
  };

  return (
    <main className="flex flex-1 flex-col">
      {returnTo ? (
        <AppBar
          type="detail"
          title="로그인"
          onBack={() => navigate({ to: returnTo })}
        />
      ) : (
        <AppBar type="main" />
      )}

      <div className="flex flex-1 flex-col items-center px-8">
        <Lottie
          key={lottieKey}
          animationData={flyingMoneyAnimation}
          loop={false}
          autoplay
          className="-mt-12 h-[260px] w-full"
        />

        <div className="z-1 -mt-20 flex flex-col items-center gap-3">
          <MoaLogoIcon className="h-[44px] w-[144px]" />
          <p className="b2-500 text-text-medium">
            실시간으로 월급이 쌓이는 경험!
          </p>
        </div>
      </div>

      {socialLogin.isError && (
        <p className="b2-400 text-red-40 px-8 text-center">
          로그인 실패: {socialLogin.error.message}
        </p>
      )}

      <div className="flex flex-col items-center gap-3 px-8 pb-8">
        <Button
          variant="tertiary"
          rounded="full"
          size="lg"
          fullWidth
          className="bg-[#fee500] active:bg-[#e6cf00]"
          onClick={() => handleSocialLogin('kakao')}
        >
          <span className="flex items-center justify-center gap-2">
            <KakaoLogoIcon />
            카카오로 계속하기
          </span>
        </Button>

        <Button
          variant="tertiary"
          rounded="full"
          size="lg"
          fullWidth
          onClick={() => handleSocialLogin('apple')}
        >
          <span className="flex items-center justify-center gap-2">
            <AppleLogoIcon />
            Apple로 계속하기
          </span>
        </Button>

        {!returnTo && (
          <Button variant="link" onClick={handleGuestStart}>
            게스트로 시작하기
          </Button>
        )}
      </div>

      <AlertDialog open={isRetryDialogOpen} onOpenChange={setIsRetryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>새 로그인 창을 열까요?</AlertDialogTitle>
            <AlertDialogDescription>
              새 창을 열면 지금 열려 있는 로그인 창은 사용할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>기존 창 유지</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRetrySocialLogin()}>
              새로 열기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
