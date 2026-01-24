import { useMutation, useQueryClient } from '@tanstack/react-query';

import { commands } from '~/lib/tauri-bindings';
import { useUIStore } from '~/stores/ui-store';

export function ResetDataButton() {
  const queryClient = useQueryClient();
  const onResetApp = useUIStore((s) => s.onResetApp);
  const setShowSettings = useUIStore((s) => s.setShowSettings);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await commands.resetAllData();
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.clear();
      setShowSettings(false);
      onResetApp?.();
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50"
    >
      {mutation.isPending ? '초기화 중...' : '데이터 초기화'}
    </button>
  );
}
