import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import { generateRandomNickname } from '~/features/settings/lib/nickname-pool';
import { commands, type SalaryType } from '~/lib/tauri-bindings';
import { authQuery, userSettingsQuery } from '~/queries';

export const SALARY_TYPE_OPTIONS = [
  { value: 'monthly', label: '월급' },
  { value: 'yearly', label: '연봉' },
] as const satisfies { value: SalaryType; label: string }[];

export interface OnboardingFormValues {
  salaryType: SalaryType;
  salaryAmount: number;
  payDay: number;
  workDays: number[];
  workStartTime: string;
  workEndTime: string;
}

const DEFAULT_VALUES: OnboardingFormValues = {
  salaryType: SALARY_TYPE_OPTIONS[0].value,
  salaryAmount: 3_000_000,
  payDay: 25,
  workDays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '18:00',
};

interface UseOnboardingFormOptions {
  onSuccess: () => void;
}

export function useOnboardingForm({ onSuccess }: UseOnboardingFormOptions) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: async ({ value }) => {
      const result = await commands.saveUserSettings({
        ...value,
        onboardingCompleted: true,
      });

      if (result.status === 'error') {
        throw new Error(result.error);
      }

      // 서버 온보딩 완료 시그널: /api/v1/onboarding/{payroll,work-policy,profile} PATCH.
      // nickname은 자동 생성 — 사용자는 추후 /settings/edit-nickname 에서 수정.
      const nickname = generateRandomNickname();
      const completeResult = await commands.completeOnboarding(nickname);
      if (completeResult.status === 'error') {
        throw new Error(completeResult.error);
      }

      await queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
      await queryClient.invalidateQueries({
        queryKey: authQuery.all(),
      });
      void commands.notifySettingsChanged();
      onSuccess();
    },
  });

  return form;
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
