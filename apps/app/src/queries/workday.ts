import { queryOptions } from '@tanstack/react-query';

import {
  commands,
  unwrapResult,
  type WorkdayCache,
} from '~/lib/tauri-bindings';

/**
 * Workday 캐시 TanStack Query.
 *
 * See: apps/app/docs/patterns/server-sync.md
 *
 * fetchWorkday 명령은 서버 우선 hydrate + 로컬 dirty 보호를 내부에서 처리한다.
 * 따라서 이 query는 단순히 그 결과를 캐싱한다.
 */
export const workdayQuery = {
  all: () => ['workday'] as const,
  byDate: (date: string) => [...workdayQuery.all(), date] as const,
};

export const workdayQueryOptions = {
  byDate: (date: string) =>
    queryOptions({
      queryKey: workdayQuery.byDate(date),
      queryFn: async (): Promise<WorkdayCache> => {
        return unwrapResult(await commands.fetchWorkday(date));
      },
    }),
};
