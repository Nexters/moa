import { useQuery } from '@tanstack/react-query';

import { commands, unwrapResult } from '~/lib/tauri-bindings';

export function useUserSettings() {
  return useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      return unwrapResult(await commands.loadUserSettings());
    },
  });
}
