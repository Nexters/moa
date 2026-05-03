import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { commands } from '~/lib/tauri-bindings';

export const WITHDRAWAL_REASON_OPTIONS = [
  '앱 오류로 사용하기 불편해요',
  '원하는 기능이 부족해요',
  '서비스 이용이 복잡하거나 불편해요',
  '급여 계산이 실제와 달라요',
  '자주 사용하지 않아요',
  '개인정보 · 보안이 걱정돼요',
] as const;

export interface WithdrawalFormValues {
  reasons: string[];
}

export function useWithdrawalForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useForm({
    defaultValues: { reasons: [] as string[] } satisfies WithdrawalFormValues,
    onSubmit: async ({ value }) => {
      const result = await commands.withdrawMember(value.reasons);
      if (result.status === 'error') {
        toast.error(`회원 탈퇴 실패: ${result.error}`);
        throw new Error(result.error);
      }

      void commands.notifySettingsChanged();
      queryClient.clear();
      toast('회원 탈퇴가 완료되었습니다.');
      void navigate({ to: '/login' });
    },
  });
}

export type WithdrawalForm = ReturnType<typeof useWithdrawalForm>;
