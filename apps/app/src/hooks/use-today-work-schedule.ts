import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { commands, unwrapResult } from '~/lib/tauri-bindings';
import { getTodayString } from '~/lib/time';
import { emergencyDataQuery, emergencyDataQueryOptions } from '~/queries';

const SCHEDULE_FILENAME = 'today-work-schedule';

interface TodayWorkScheduleData {
  date: string;
  workStartTime: string;
  workEndTime: string;
}

export interface TodayWorkSchedule {
  workStartTime: string;
  workEndTime: string;
}

export function useTodayWorkSchedule() {
  const queryClient = useQueryClient();
  const today = getTodayString();

  const { data: rawData, isLoading } = useQuery(
    emergencyDataQueryOptions.file<TodayWorkScheduleData>(SCHEDULE_FILENAME),
  );

  const schedule: TodayWorkSchedule | null =
    rawData && rawData.date === today
      ? {
          workStartTime: rawData.workStartTime,
          workEndTime: rawData.workEndTime,
        }
      : null;

  const saveMutation = useMutation({
    mutationFn: async ({
      startTime,
      endTime,
    }: {
      startTime: string;
      endTime: string;
    }) => {
      const today = getTodayString();
      unwrapResult(
        await commands.saveEmergencyData(SCHEDULE_FILENAME, {
          date: today,
          workStartTime: startTime,
          workEndTime: endTime,
        }),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(SCHEDULE_FILENAME),
      });
      void commands.notifySettingsChanged();
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      unwrapResult(await commands.saveEmergencyData(SCHEDULE_FILENAME, null));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(SCHEDULE_FILENAME),
      });
      void commands.notifySettingsChanged();
    },
  });

  return {
    schedule,
    isLoading,
    isSaving: saveMutation.isPending,
    saveSchedule: (startTime: string, endTime: string) =>
      saveMutation.mutateAsync({ startTime, endTime }),
    clearSchedule: () => clearMutation.mutateAsync(),
  };
}
