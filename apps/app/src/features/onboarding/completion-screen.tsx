import { useConfetti } from '~/hooks/use-confetti';
import { useUIStore } from '~/stores/ui-store';
import { AppBar, Button } from '~/ui';

import type { OnboardingScreenProps } from './hooks/use-onboarding-screen';

export function CompletionScreen(_props: OnboardingScreenProps) {
  const navigate = useUIStore((s) => s.navigate);

  useConfetti();

  const handleComplete = () => {
    navigate('home');
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={handleComplete} />

      {/* 컨텐츠 영역 */}
      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-32">
        {/* 이미지 placeholder */}
        <div className="bg-container-secondary size-[150px] rounded-2xl" />

        <h1 className="text-t2-700 text-text-high mt-6 text-center">
          모든 준비가 끝났어요!
        </h1>

        <p className="text-b1-400 text-text-medium mt-3 text-center">
          월급 정보 입력을 성공적으로 마쳤어요.
          <br />
          이제 근무를 시작해볼까요?
        </p>
      </div>

      {/* 완료 버튼 */}
      <div className="absolute inset-x-0 bottom-9 flex justify-center">
        <Button
          rounded="full"
          size="lg"
          className="w-60"
          onClick={handleComplete}
        >
          완료
        </Button>
      </div>
    </main>
  );
}
