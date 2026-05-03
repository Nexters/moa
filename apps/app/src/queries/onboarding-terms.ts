import { queryOptions } from '@tanstack/react-query';

import { commands, unwrapResult } from '~/lib/tauri-bindings';

export const onboardingTermsQuery = {
  all: () => ['onboardingTerms'] as const,
};

export const onboardingTermsQueryOptions = {
  list: () =>
    queryOptions({
      queryKey: onboardingTermsQuery.all(),
      queryFn: async () => unwrapResult(await commands.getOnboardingTerms()),
    }),
};
