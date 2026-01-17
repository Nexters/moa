import { useOnboardingStore } from '~/stores/onboarding-store';

import { StepCompany } from './steps/step-company';
import { StepNickname } from './steps/step-nickname';
import { StepSalary } from './steps/step-salary';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  return (
    <div className="flex h-full flex-col">
      {/* Progress indicator */}
      <div className="flex gap-2 p-4">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded ${
              step <= currentStep ? 'bg-blue-500' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 p-4">
        {currentStep === 1 && <StepNickname />}
        {currentStep === 2 && <StepCompany />}
        {currentStep === 3 && <StepSalary onComplete={onComplete} />}
      </div>
    </div>
  );
}
