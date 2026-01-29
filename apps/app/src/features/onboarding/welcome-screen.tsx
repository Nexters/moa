import { AppBar, Button, MoaMoneyIcon, TooltipBubble } from '~/ui';

import type { OnboardingScreenProps } from './hooks/use-onboarding-screen';

export function WelcomeScreen({ onNext }: OnboardingScreenProps) {
  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="main" onSettings={() => {}} />

      <div className="flex flex-col items-center gap-5 px-5 pt-9">
        <TooltipBubble>
          월급 정보를 추가하고 실시간으로
          <br />
          쌓이는 월급을 확인하세요!
        </TooltipBubble>

        <MoaMoneyIcon className="size-20" />

        <div className="flex flex-col items-center gap-[2px]">
          <span className="text-b1-400 text-text-medium">
            나는 얼마나 벌까?
          </span>
          <div className="flex items-end gap-1">
            <span className="text-h1-700 text-green-40">0,00</span>
            <span className="text-t2-400 text-text-medium pb-2">원</span>
          </div>
        </div>
      </div>

      <div className="mt-15 flex justify-center">
        <Button rounded="full" size="md" className="w-60" onClick={onNext}>
          월급 정보 등록하기
        </Button>
      </div>
    </main>
  );
}
