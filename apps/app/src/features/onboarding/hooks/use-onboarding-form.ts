import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import { commands, type SalaryType } from '~/lib/tauri-bindings';
import { userSettingsQuery } from '~/queries';

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
  lunchStartTime: string;
  lunchEndTime: string;
}

const DEFAULT_VALUES: OnboardingFormValues = {
  salaryType: SALARY_TYPE_OPTIONS[0].value,
  salaryAmount: 3_000_000,
  payDay: 25,
  workDays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '18:00',
  lunchStartTime: '12:00',
  lunchEndTime: '13:00',
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

      await queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
      onSuccess();
    },
  });

  return form;
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
