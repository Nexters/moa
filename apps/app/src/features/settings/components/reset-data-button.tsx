import { useMutation, useQueryClient } from '@tanstack/react-query';

import { commands } from '~/lib/tauri-bindings';
import { useUIStore } from '~/stores/ui-store';

export function ResetDataButton() {
  const queryClient = useQueryClient();
  const navigate = useUIStore((s) => s.navigate);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await commands.resetAllData();
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('onboarding');
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="b2-400 text-error hover:bg-interactive-hover flex w-full items-center justify-between px-4 py-3.5 transition-colors first:rounded-t-md last:rounded-b-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{mutation.isPending ? '초기화 중...' : '데이터 초기화'}</span>
    </button>
  );
}
