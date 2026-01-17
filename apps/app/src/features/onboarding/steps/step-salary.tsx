import { useState } from 'react';

import { commands } from '~/lib/tauri-bindings';
import { useOnboardingStore } from '~/stores/onboarding-store';

interface StepSalaryProps {
  onComplete: () => void;
}

export function StepSalary({ onComplete }: StepSalaryProps) {
  const data = useOnboardingStore((s) => s.data);
  const updateData = useOnboardingStore((s) => s.updateData);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const reset = useOnboardingStore((s) => s.reset);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    const num = parseInt(value, 10);
    updateData({ monthlyNetSalary: isNaN(num) ? 0 : num });
  };

  const handleComplete = async () => {
    if (data.monthlyNetSalary <= 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await commands.saveUserSettings({
        nickname: data.nickname,
        companyName: data.companyName,
        monthlyNetSalary: data.monthlyNetSalary,
        payDay: 25,
        onboardingCompleted: true,
      });

      if (result.status === 'error') {
        setError(result.error);
        return;
      }

      reset();
      onComplete();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedSalary =
    data.monthlyNetSalary > 0 ? data.monthlyNetSalary.toLocaleString() : '';

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">월 실수령액을 알려주세요</h2>
      <p className="text-sm text-gray-400">세후 실제 통장에 들어오는 금액</p>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="3,000,000"
          value={formattedSalary}
          onChange={handleSalaryChange}
          className="w-full rounded border border-gray-600 bg-gray-800 p-3 pr-8 text-right text-xl text-white placeholder-gray-500"
        />
        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
          원
        </span>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 cursor-pointer rounded border border-gray-600 p-3 hover:bg-gray-800"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={data.monthlyNetSalary <= 0 || isSubmitting}
          className="flex-1 cursor-pointer rounded bg-blue-500 p-3 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}
