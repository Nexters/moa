import { useQuery } from '@tanstack/react-query';

import type { WorkdayCache } from '~/lib/tauri-bindings';
import { getTodayString } from '~/lib/time';
import { workdayQueryOptions } from '~/queries/workday';

/**
 * 오늘의 workday 캐시 hook.
 *
 * 서버↔로컬 동기화는 fetch_workday(Rust)가 담당. 이 hook은 그 결과를 구독한다.
 * Write 액션(휴무 토글, 임시 근무시간 등)은 후속 단계에서 추가된다.
 *
 * See: apps/app/docs/patterns/server-sync.md
 */
export function useTodayWorkday(): {
  workday: WorkdayCache | undefined;
  isLoading: boolean;
} {
  const today = getTodayString();
  const { data, isLoading } = useQuery(workdayQueryOptions.byDate(today));
  return { workday: data, isLoading };
}
