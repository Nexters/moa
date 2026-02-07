import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { commands, unwrapResult } from '~/lib/tauri-bindings';
import { getTodayString } from '~/lib/time';
import { emergencyDataQuery, emergencyDataQueryOptions } from '~/queries';

const ACK_FILENAME = 'work-completed-ack';

interface AckData {
  date: string;
}

export function useWorkCompletedAck() {
  const queryClient = useQueryClient();
  const today = getTodayString();

  const { data: rawData, isLoading } = useQuery(
    emergencyDataQueryOptions.file<AckData>(ACK_FILENAME),
  );

  const isAcknowledged = rawData != null && rawData.date === today;

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const today = getTodayString();
      unwrapResult(
        await commands.saveEmergencyData(ACK_FILENAME, { date: today }),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(ACK_FILENAME),
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      unwrapResult(await commands.saveEmergencyData(ACK_FILENAME, null));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: emergencyDataQuery.file(ACK_FILENAME),
      });
    },
  });

  return {
    isAcknowledged,
    isLoading,
    acknowledge: () => acknowledgeMutation.mutateAsync(),
    clearAcknowledge: () => clearMutation.mutateAsync(),
  };
}
