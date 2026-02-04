import { queryOptions } from '@tanstack/react-query';
import { getVersion } from '@tauri-apps/api/app';
import { isEnabled } from '@tauri-apps/plugin-autostart';

export const appQuery = {
  all: () => ['app'] as const,
  version: () => [...appQuery.all(), 'version'] as const,
  autostart: () => [...appQuery.all(), 'autostart'] as const,
};

export const appQueryOptions = {
  version: () =>
    queryOptions({
      queryKey: appQuery.version(),
      queryFn: getVersion,
      staleTime: Infinity,
    }),
  autostart: () =>
    queryOptions({
      queryKey: appQuery.autostart(),
      queryFn: isEnabled,
      staleTime: Infinity,
    }),
};
