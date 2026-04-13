import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AuthProvider } from '~/lib/tauri-bindings';
import { commands } from '~/lib/tauri-bindings';
import { authQuery, authQueryOptions, userSettingsQuery } from '~/queries';

export function useAuthStatus() {
  return useQuery(authQueryOptions.status());
}

export function useSocialLogin() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (provider: AuthProvider) => {
      const result = await commands.socialLogin(provider);
      if (result.status === 'error') throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQuery.all() });
      void queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
      void commands.notifySettingsChanged();
    },
    onError: (error) => {
      if (error.message.includes('취소')) {
        mutation.reset();
      }
    },
  });

  return mutation;
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await commands.logout();
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQuery.all() });
    },
  });
}
