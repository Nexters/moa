import { queryOptions } from '@tanstack/react-query';
import { isEnabled } from '@tauri-apps/plugin-autostart';

export const appQuery = {
  all: () => ['app'] as const,
  autostart: () => [...appQuery.all(), 'autostart'] as const,
};

export const appQueryOptions = {
  autostart: () =>
    queryOptions({
      queryKey: appQuery.autostart(),
      queryFn: isEnabled,
      staleTime: Infinity,
    }),
};
