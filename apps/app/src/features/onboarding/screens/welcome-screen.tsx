import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

import { useSocialLogin } from '~/hooks/use-auth';
import { userSettingsQuery } from '~/queries';
import { AppBar, Button, HeroIcon, TooltipBubble } from '~/ui';

import { useOnboardingContext } from '..';

export function WelcomeScreen() {
  const { goToNext } = useOnboardingContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socialLogin = useSocialLogin();

  const handleSocialLogin = (provider: 'kakao' | 'apple') => {
    socialLogin.mutate(provider, {
      onSuccess: (result) => {
        if (result.needsOnboarding) {
          goToNext();
        } else {
          void queryClient.invalidateQueries({
            queryKey: userSettingsQuery.all(),
          });
          void navigate({ to: '/home' });
        }
      },
      onError: (error) => {
        console.error('소셜 로그인 실패:', error);
      },
    });
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="main" />

      <div className="flex flex-col items-center gap-5 px-5 pt-9">
        <TooltipBubble>
          월급 정보를 추가하고 실시간으로
          <br />
          쌓이는 월급을 확인하세요!
        </TooltipBubble>

        <HeroIcon variant="empty" />

        <div className="flex flex-col items-center gap-[2px]">
          <span className="b1-400 text-text-medium">나는 얼마나 벌까?</span>
          <div className="flex items-end gap-1">
            <span className="h1-700 text-green-40">0,00</span>
            <span className="t2-400 text-text-medium pb-2">원</span>
          </div>
        </div>
      </div>

      {socialLogin.isError && (
        <p className="b2-400 mt-4 px-5 text-center text-red-40">
          로그인 실패: {socialLogin.error.message}
        </p>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button
          rounded="full"
          size="md"
          className="w-60"
          disabled={socialLogin.isPending}
          onClick={() => handleSocialLogin('kakao')}
        >
          {socialLogin.isPending ? '로그인 중...' : '카카오로 시작하기'}
        </Button>
        <Button
          rounded="full"
          size="md"
          variant="secondary"
          className="w-60"
          disabled={socialLogin.isPending}
          onClick={() => handleSocialLogin('apple')}
        >
          Apple로 시작하기
        </Button>
        <Button
          variant="link"
          disabled={socialLogin.isPending}
          onClick={goToNext}
        >
          로그인 없이 시작
        </Button>
      </div>
    </main>
  );
}
