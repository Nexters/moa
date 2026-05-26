import { useWorkday, type WorkdayStatus } from './use-workday';

/**
 * @deprecated 새 코드는 `useWorkday`를 직접 사용하세요.
 * 이 hook은 기존 호출처 호환을 위한 adapter이며 내부적으로 `useWorkday`를 호출합니다.
 *
 * See: apps/app/docs/patterns/server-sync.md
 */
export type TodayWorkStatus = WorkdayStatus;

export function useTodayWorkStatus() {
  const { status, isLoading, isSaving, saveStatus, clearStatus } = useWorkday();
  return {
    status,
    isLoading,
    isSaving,
    saveStatus: (next: TodayWorkStatus) => saveStatus(next),
    clearStatus,
  };
}
