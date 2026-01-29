import { useForm } from '@tanstack/react-form';

import { commands, type SalaryType } from '~/lib/tauri-bindings';

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

export function useOnboardingForm() {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: {
      onSubmit: ({ value }) => {
        const errors: Partial<Record<keyof OnboardingFormValues, string>> = {};

        if (value.salaryAmount <= 0) {
          errors.salaryAmount = '급여 금액은 0보다 커야 합니다';
        }

        if (value.payDay < 1 || value.payDay > 31) {
          errors.payDay = '급여일은 1~31 사이여야 합니다';
        }

        if (value.workDays.length === 0) {
          errors.workDays = '근무 요일을 선택해주세요';
        }

        if (!value.workStartTime) {
          errors.workStartTime = '출근 시간을 입력해주세요';
        }

        if (!value.workEndTime) {
          errors.workEndTime = '퇴근 시간을 입력해주세요';
        }

        if (!value.lunchStartTime) {
          errors.lunchStartTime = '점심 시작 시간을 입력해주세요';
        }

        if (!value.lunchEndTime) {
          errors.lunchEndTime = '점심 종료 시간을 입력해주세요';
        }

        if (Object.keys(errors).length > 0) {
          return { fields: errors };
        }

        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const result = await commands.saveUserSettings({
        salaryType: value.salaryType,
        salaryAmount: value.salaryAmount,
        payDay: value.payDay,
        workDays: value.workDays,
        workStartTime: value.workStartTime,
        workEndTime: value.workEndTime,
        lunchStartTime: value.lunchStartTime,
        lunchEndTime: value.lunchEndTime,
        onboardingCompleted: true,
        showMenubarSalary: true,
      });

      if (result.status === 'error') {
        throw new Error(result.error);
      }
    },
  });

  return form;
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
