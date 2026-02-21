import { useNavigate } from '@tanstack/react-router';

import { useLottieOverlay } from '~/hooks/use-lottie-overlay';
import { AppBar, AppFooter, Button } from '~/ui';

export function CompletionScreen() {
  const navigate = useNavigate();

  const lottieOverlay = useLottieOverlay();

  const handleComplete = () => {
    void navigate({ to: '/home' });
  };

  return (
    <main className="flex flex-1 flex-col">
      {lottieOverlay}
      <AppBar type="detail" onBack={handleComplete} />

      {/* 컨텐츠 영역 */}
      <div className="relative flex flex-1 flex-col items-center px-6 pt-16">
        {/* 이미지 placeholder */}
        <div className="bg-container-secondary size-[150px] rounded-2xl" />

        <h1 className="t2-700 text-text-high mt-6 text-center">
          모든 준비가 끝났어요!
        </h1>

        <p className="b1-400 text-text-medium mt-3 text-center">
          월급 정보 입력을 성공적으로 마쳤어요.
          <br />
          이제 근무를 시작해볼까요?
        </p>
      </div>

      {/* 완료 버튼 */}
      <AppFooter>
        <Button
          rounded="full"
          size="lg"
          className="w-60"
          onClick={handleComplete}
        >
          완료
        </Button>
      </AppFooter>
    </main>
  );
}
