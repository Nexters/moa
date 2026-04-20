import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import moneyBg from '~/assets/money-bg.png';
import { useSocialLogin } from '~/hooks/use-auth';
import { commands } from '~/lib/tauri-bindings';
import { userSettingsQuery } from '~/queries';
import { AppBar, Button } from '~/ui';
import { AppleLogoIcon, KakaoLogoIcon, MoaLogoIcon } from '~/ui/icons';

const route = getRouteApi('/login');

export function LoginScreen() {
  const { returnTo } = route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socialLogin = useSocialLogin();

  const handleSocialLogin = async (provider: 'kakao' | 'apple') => {
    if (socialLogin.isPending) {
      await commands.cancelSocialLogin();
    }
    socialLogin.mutate(provider, {
      onSuccess: (result) => {
        if (result.needsOnboarding) {
          void navigate({ to: '/onboarding/salary' });
        } else {
          void queryClient.invalidateQueries({
            queryKey: userSettingsQuery.all(),
          });
          void navigate({ to: returnTo ?? '/home' });
        }
      },
    });
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

      <div className="flex flex-1 flex-col items-center px-6 pt-3">
        <img src={moneyBg} alt="" className="w-[340px] object-contain" />

        <div className="-mt-16 flex flex-col items-center gap-3">
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

      {socialLogin.isPending && (
        <p className="b2-400 text-text-low animate-pulse pb-2 text-center">
          브라우저에서 로그인을 완료해 주세요
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
    </main>
  );
}
