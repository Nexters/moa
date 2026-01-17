import { useOnboardingStore } from '~/stores/onboarding-store';

export function StepCompany() {
  const companyName = useOnboardingStore((s) => s.data.companyName);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const regenerateCompany = useOnboardingStore((s) => s.regenerateCompany);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-xl font-bold">오늘도 출근하는 곳은</h2>

      <div className="text-3xl font-bold text-blue-400">{companyName}</div>

      <button
        type="button"
        onClick={regenerateCompany}
        className="cursor-pointer text-sm text-gray-400 underline hover:text-gray-300"
      >
        다시 뽑기
      </button>

      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 cursor-pointer rounded border border-gray-600 p-3 hover:bg-gray-800"
        >
          이전
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="flex-1 cursor-pointer rounded bg-blue-500 p-3 text-white hover:bg-blue-600"
        >
          다음
        </button>
      </div>
    </div>
  );
}
