import { queryOptions } from '@tanstack/react-query';

import { commands, unwrapResult } from '~/lib/tauri-bindings';

export const userSettingsQuery = {
  all: () => ['userSettings'] as const,
};

export const userSettingsQueryOptions = {
  detail: () =>
    queryOptions({
      queryKey: userSettingsQuery.all(),
      queryFn: async () => unwrapResult(await commands.loadUserSettings()),
    }),
};
