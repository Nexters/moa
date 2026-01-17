import { useOnboardingStore } from '~/stores/onboarding-store';

export function StepNickname() {
  const nickname = useOnboardingStore((s) => s.data.nickname);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const regenerateNickname = useOnboardingStore((s) => s.regenerateNickname);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-bold">당신의 닉네임은</h2>

      <div className="text-3xl font-bold text-blue-400">{nickname}</div>

      <button
        type="button"
        onClick={regenerateNickname}
        className="cursor-pointer text-sm text-gray-400 underline hover:text-gray-300"
      >
        다시 뽑기
      </button>

      <button
        type="button"
        onClick={nextStep}
        className="w-full cursor-pointer rounded bg-blue-500 p-3 text-white hover:bg-blue-600"
      >
        다음
      </button>
    </div>
  );
}
