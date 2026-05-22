import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { commands, unwrapResult } from '~/lib/tauri-bindings';
import { getTodayString } from '~/lib/time';
import { emergencyDataQuery, emergencyDataQueryOptions } from '~/queries';

const STATUS_FILENAME = 'today-work-status';
const LEGACY_VACATION_FILENAME = 'vacation-state';

export type TodayWorkStatus = 'annual-leave' | 'day-off' | 'public-holiday';

interface TodayWorkStatusData {
  date: string;
  status: TodayWorkStatus;
}

interface LegacyVacationData {
  date: string;
}

export function useTodayWorkStatus() {
  const queryClient = useQueryClient();
  const today = getTodayString();

  const { data: rawStatus, isLoading: statusLoading } = useQuery(
    emergencyDataQueryOptions.file<TodayWorkStatusData>(STATUS_FILENAME),
  );
  const { data: legacyVacation, isLoading: legacyLoading } = useQuery(
    emergencyDataQueryOptions.file<LegacyVacationData>(
      LEGACY_VACATION_FILENAME,
    ),
  );

  const status =
    rawStatus?.date === today
      ? rawStatus.status
      : legacyVacation?.date === today
        ? 'annual-leave'
        : null;

  const saveMutation = useMutation({
    mutationFn: async (status: TodayWorkStatus) => {
      unwrapResult(
        await commands.saveEmergencyData(STATUS_FILENAME, {
          date: today,
          status,
        }),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(STATUS_FILENAME),
      });
      void commands.notifySettingsChanged();
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.all([
        commands.saveEmergencyData(STATUS_FILENAME, null),
        commands.saveEmergencyData(LEGACY_VACATION_FILENAME, null),
      ]);
      results.forEach(unwrapResult);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(STATUS_FILENAME),
      });
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(LEGACY_VACATION_FILENAME),
      });
      void commands.notifySettingsChanged();
    },
  });

  return {
    status,
    isLoading: statusLoading || legacyLoading,
    isSaving: saveMutation.isPending || clearMutation.isPending,
    saveStatus: (status: TodayWorkStatus) => saveMutation.mutateAsync(status),
    clearStatus: () => clearMutation.mutateAsync(),
  };
}
