import { queryOptions } from '@tanstack/react-query';

import { commands, unwrapResult } from '~/lib/tauri-bindings';

export const authQuery = {
  all: () => ['auth'] as const,
  status: () => [...authQuery.all(), 'status'] as const,
};

export const authQueryOptions = {
  status: () =>
    queryOptions({
      queryKey: authQuery.status(),
      queryFn: async () => unwrapResult(await commands.getAuthStatus()),
    }),
};
