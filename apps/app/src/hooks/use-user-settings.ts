import { useQuery } from '@tanstack/react-query';

import { userSettingsQueryOptions } from '~/queries';

export function useUserSettings() {
  return useQuery(userSettingsQueryOptions.detail());
}
