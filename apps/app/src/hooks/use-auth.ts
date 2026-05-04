import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQuery.all() });
      void queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
      void commands.notifySettingsChanged();
      // 닉네임 자동 등록은 useOnboardingForm 의 completeOnboarding 으로 일원화.
      // 여기서 일반 PATCH 를 호출해도 신규 사용자는 ONBOARDING_INCOMPLETE 로 거부되고,
      // 기존 사용자에겐 dead PATCH 가 되어 비효율 + 덮어쓰기 위험만 남는다.
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
