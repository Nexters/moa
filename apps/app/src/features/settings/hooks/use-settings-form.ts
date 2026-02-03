import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import {
  commands,
  type SalaryType,
  type UserSettings,
} from '~/lib/tauri-bindings';

export const SALARY_TYPE_OPTIONS = [
  { value: 'monthly', label: '월급' },
  { value: 'yearly', label: '연봉' },
] as const satisfies readonly { value: SalaryType; label: string }[];

export interface SettingsFormValues {
  salaryType: SalaryType;
  salaryAmount: number;
  payDay: number;
  workDays: number[];
  workStartTime: string;
  workEndTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
}

interface UseSettingsFormOptions {
  settings: UserSettings;
  onSuccess?: () => void;
}

export function useSettingsForm({ settings, onSuccess }: UseSettingsFormOptions) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      salaryType: settings.salaryType ?? 'monthly',
      salaryAmount: settings.salaryAmount,
      payDay: settings.payDay,
      workDays: settings.workDays ?? [1, 2, 3, 4, 5],
      workStartTime: settings.workStartTime ?? '09:00',
      workEndTime: settings.workEndTime ?? '18:00',
      lunchStartTime: settings.lunchStartTime ?? '12:00',
      lunchEndTime: settings.lunchEndTime ?? '13:00',
    } satisfies SettingsFormValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors: Partial<Record<keyof SettingsFormValues, string>> = {};

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
        ...settings,
        salaryType: value.salaryType,
        salaryAmount: value.salaryAmount,
        payDay: value.payDay,
        workDays: value.workDays,
        workStartTime: value.workStartTime,
        workEndTime: value.workEndTime,
        lunchStartTime: value.lunchStartTime,
        lunchEndTime: value.lunchEndTime,
      });

      if (result.status === 'error') {
        throw new Error(result.error);
      }

      await queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      onSuccess?.();
    },
  });

  return form;
}

export type SettingsForm = ReturnType<typeof useSettingsForm>;
