import { useMutation, useQueryClient } from '@tanstack/react-query';

import { commands, type UserSettings } from '~/lib/tauri-bindings';

import { PayDaySelect } from './inputs/pay-day-select';
import { SalaryInput } from './inputs/salary-input';
import { ToggleInput } from './inputs/toggle-input';
import { ResetDataButton } from './reset-data-button';
import { SettingField } from './setting-field';

interface Props {
  settings: UserSettings;
}

export function SettingsForm({ settings }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      const result = await commands.saveUserSettings(newSettings);
      if (result.status === 'error') throw new Error(result.error);
    },
    onMutate: async (newSettings: UserSettings) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['userSettings'] });

      // Snapshot previous value for rollback
      const previousSettings = queryClient.getQueryData<UserSettings>([
        'userSettings',
      ]);

      // Optimistically update the cache
      queryClient.setQueryData(['userSettings'], newSettings);

      return { previousSettings };
    },
    onError: (_error, _newSettings, context) => {
      // Rollback to previous value on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['userSettings'], context.previousSettings);
      }
    },
    onSettled: () => {
      // Always refetch to ensure we have authoritative server data
      void queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const handleSave = (partial: Partial<UserSettings>) => {
    // Read latest settings from cache to avoid race conditions
    const currentSettings =
      queryClient.getQueryData<UserSettings>(['userSettings']) ?? settings;
    mutation.mutate({ ...currentSettings, ...partial });
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      {/* 급여 금액 */}
      <SettingField label="급여 금액">
        <SalaryInput
          value={settings.salaryAmount}
          onSave={(value) => handleSave({ salaryAmount: value })}
        />
      </SettingField>

      {/* 월급날 */}
      <SettingField label="월급날">
        <PayDaySelect
          value={settings.payDay}
          onSave={(value) => handleSave({ payDay: value })}
        />
      </SettingField>

      {/* 상태바 금액 표시 */}
      <SettingField label="상태바 금액 표시">
        <ToggleInput
          value={settings.showMenubarSalary ?? true}
          onSave={(value) => handleSave({ showMenubarSalary: value })}
        />
      </SettingField>

      {/* 구분선 */}
      <div className="my-2 border-t border-white/10" />

      {/* 데이터 초기화 */}
      <SettingField label="위험 영역">
        <ResetDataButton />
      </SettingField>
    </div>
  );
}
