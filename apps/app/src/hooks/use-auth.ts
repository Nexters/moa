import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { generateRandomNickname } from '~/features/settings/lib/nickname-pool';
import { posthog } from '~/lib/analytics';
import type { AuthProvider } from '~/lib/tauri-bindings';
import { commands } from '~/lib/tauri-bindings';
import { authQuery, authQueryOptions, userSettingsQuery } from '~/queries';

export function useAuthStatus() {
  return useQuery(authQueryOptions.status());
}

export function useProfileNickname() {
  const { data: authStatus } = useAuthStatus();
  return useQuery({
    ...authQueryOptions.nickname(),
    enabled: authStatus?.isLoggedIn === true,
  });
}

export function useSocialLogin() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (provider: AuthProvider) => {
      const result = await commands.socialLogin(provider);
      if (result.status === 'error') throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: authQuery.all() });
      void queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
      void commands.notifySettingsChanged();

      try {
        const cur = await commands.getProfileNickname();
        if (cur.status === 'ok' && (cur.data ?? '').trim() === '') {
          const patched = await commands.updateProfileNickname(
            generateRandomNickname(),
          );
          if (patched.status === 'ok') {
            void queryClient.invalidateQueries({
              queryKey: authQuery.nickname(),
            });
          }
        }
      } catch (e) {
        posthog.captureException(e);
      }
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

export function useUpdateNickname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nickname: string) => {
      const result = await commands.updateProfileNickname(nickname);
      if (result.status === 'error') throw new Error(result.error);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQuery.nickname() });
    },
  });
}
