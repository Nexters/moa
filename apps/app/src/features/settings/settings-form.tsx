import { useMutation, useQueryClient } from '@tanstack/react-query';

import { commands, type UserSettings } from '~/lib/tauri-bindings';

import { PayDaySelect } from './inputs/pay-day-select';
import { SalaryInput } from './inputs/salary-input';
import { TextInput } from './inputs/text-input';
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const handleSave = (partial: Partial<UserSettings>) => {
    mutation.mutate({ ...settings, ...partial });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 닉네임 */}
      <SettingField label="닉네임">
        <TextInput
          value={settings.nickname}
          onSave={(value) => handleSave({ nickname: value })}
        />
      </SettingField>

      {/* 회사명 */}
      <SettingField label="회사명">
        <TextInput
          value={settings.companyName}
          onSave={(value) => handleSave({ companyName: value })}
        />
      </SettingField>

      {/* 월 실수령액 */}
      <SettingField label="월 실수령액">
        <SalaryInput
          value={settings.monthlyNetSalary}
          onSave={(value) => handleSave({ monthlyNetSalary: value })}
        />
      </SettingField>

      {/* 월급날 */}
      <SettingField label="월급날">
        <PayDaySelect
          value={settings.payDay}
          onSave={(value) => handleSave({ payDay: value })}
        />
      </SettingField>
    </div>
  );
}
