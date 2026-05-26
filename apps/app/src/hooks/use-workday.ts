import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  commands,
  unwrapResult,
  type WorkdayCache,
  type WorkdayKind,
} from '~/lib/tauri-bindings';
import { getTodayString } from '~/lib/time';
import { workdayQuery, workdayQueryOptions } from '~/queries/workday';

export type WorkdayStatus = Exclude<WorkdayKind, 'work'>;

export interface UseWorkdayResult {
  workday: WorkdayCache | undefined;
  status: WorkdayStatus | null;
  schedule: { workStartTime: string; workEndTime: string } | null;
  completed: boolean;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: (status: WorkdayStatus) => Promise<WorkdayCache>;
  clearStatus: () => Promise<WorkdayCache>;
  saveSchedule: (startTime: string, endTime: string) => Promise<WorkdayCache>;
  clearSchedule: () => Promise<WorkdayCache>;
  setCompleted: (completed: boolean) => Promise<WorkdayCache>;
}

/**
 * 오늘의 workday 통합 hook.
 *
 * 서버↔로컬 동기화는 fetch_workday + mutate_workday(Rust)가 담당.
 * 이 hook은 통합 진입점을 제공한다.
 *
 * See: apps/app/docs/patterns/server-sync.md
 */
export function useWorkday(): UseWorkdayResult {
  const queryClient = useQueryClient();
  const today = getTodayString();

  const { data: workday, isLoading } = useQuery(
    workdayQueryOptions.byDate(today),
  );

  const mutation = useMutation({
    mutationFn: async (input: {
      kind: WorkdayKind;
      clockInTime: string | null;
      clockOutTime: string | null;
      completed: boolean;
    }): Promise<WorkdayCache> => {
      return unwrapResult(
        await commands.mutateWorkday(
          today,
          input.kind,
          input.clockInTime,
          input.clockOutTime,
          input.completed,
        ),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workdayQuery.byDate(today),
      });
    },
  });

  const status: WorkdayStatus | null =
    workday && workday.kind !== 'work' ? workday.kind : null;

  const schedule =
    workday?.clockInTime != null && workday?.clockOutTime != null
      ? {
          workStartTime: workday.clockInTime,
          workEndTime: workday.clockOutTime,
        }
      : null;

  const completed = workday?.completed ?? false;

  return {
    workday,
    status,
    schedule,
    completed,
    isLoading,
    isSaving: mutation.isPending,
    saveStatus: (next) =>
      mutation.mutateAsync({
        kind: next,
        clockInTime: workday?.clockInTime ?? null,
        clockOutTime: workday?.clockOutTime ?? null,
        completed: false,
      }),
    clearStatus: () =>
      mutation.mutateAsync({
        kind: 'work',
        clockInTime: workday?.clockInTime ?? null,
        clockOutTime: workday?.clockOutTime ?? null,
        completed: workday?.completed ?? false,
      }),
    saveSchedule: (startTime, endTime) =>
      mutation.mutateAsync({
        kind: 'work',
        clockInTime: startTime,
        clockOutTime: endTime,
        completed: false,
      }),
    clearSchedule: () =>
      mutation.mutateAsync({
        kind: workday?.kind ?? 'work',
        clockInTime: null,
        clockOutTime: null,
        completed: workday?.completed ?? false,
      }),
    setCompleted: (next) =>
      mutation.mutateAsync({
        kind: workday?.kind ?? 'work',
        clockInTime: workday?.clockInTime ?? null,
        clockOutTime: workday?.clockOutTime ?? null,
        completed: next,
      }),
  };
}
