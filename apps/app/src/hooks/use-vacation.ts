import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { commands } from '~/lib/tauri-bindings';
import { getTodayString } from '~/lib/time';
import { emergencyDataQuery, emergencyDataQueryOptions } from '~/queries';

const VACATION_FILENAME = 'vacation-state';

interface VacationData {
  date: string;
}

export function useVacation() {
  const queryClient = useQueryClient();
  const today = getTodayString();

  const { data: rawData, isLoading } = useQuery(
    emergencyDataQueryOptions.file<VacationData>(VACATION_FILENAME),
  );

  const isOnVacation = rawData?.date === today;

  const setVacationMutation = useMutation({
    mutationFn: async () => {
      await commands.saveEmergencyData(VACATION_FILENAME, { date: today });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(VACATION_FILENAME),
      });
    },
  });

  const clearVacationMutation = useMutation({
    mutationFn: async () => {
      await commands.saveEmergencyData(VACATION_FILENAME, null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(VACATION_FILENAME),
      });
    },
  });

  return {
    isOnVacation,
    isLoading,
    setVacation: () => setVacationMutation.mutateAsync(),
    clearVacation: () => clearVacationMutation.mutateAsync(),
  };
}
