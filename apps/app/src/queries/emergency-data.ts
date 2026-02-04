import { queryOptions } from '@tanstack/react-query';

import { commands } from '~/lib/tauri-bindings';

export const emergencyDataQuery = {
  all: () => ['emergencyData'] as const,
  file: (filename: string) => [...emergencyDataQuery.all(), filename] as const,
};

export const emergencyDataQueryOptions = {
  file: <T = unknown>(filename: string) =>
    queryOptions({
      queryKey: emergencyDataQuery.file(filename),
      queryFn: async (): Promise<T | null> => {
        const result = await commands.loadEmergencyData(filename);
        if (result.status === 'ok') return result.data as T;
        throw new Error(`Failed to load emergency data: ${filename}`);
      },
    }),
};
