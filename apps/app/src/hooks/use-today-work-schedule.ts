import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { commands } from '~/lib/tauri-bindings';

const SCHEDULE_FILENAME = 'today-work-schedule';
export const todayWorkScheduleQueryKey = ['todayWorkSchedule'] as const;

interface TodayWorkScheduleData {
  date: string;
  workStartTime: string;
  workEndTime: string;
}

export interface TodayWorkSchedule {
  workStartTime: string;
  workEndTime: string;
}

interface TodayWorkScheduleState {
  schedule: TodayWorkSchedule | null;
  isLoading: boolean;
  saveSchedule: (startTime: string, endTime: string) => Promise<void>;
  clearSchedule: () => Promise<void>;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useTodayWorkSchedule(): TodayWorkScheduleState {
  const queryClient = useQueryClient();

  const { data: scheduleData = null, isLoading } = useQuery({
    queryKey: todayWorkScheduleQueryKey,
    queryFn: async () => {
      const result = await commands.loadEmergencyData(SCHEDULE_FILENAME);
      if (result.status === 'ok') {
        return (result.data as TodayWorkScheduleData | null) ?? null;
      }
      return null;
    },
  });

  const today = getTodayString();
  const isToday = scheduleData?.date === today;

  const schedule: TodayWorkSchedule | null = isToday
    ? {
        workStartTime: scheduleData.workStartTime,
        workEndTime: scheduleData.workEndTime,
      }
    : null;

  const saveSchedule = useCallback(
    async (startTime: string, endTime: string) => {
      const newData = {
        date: today,
        workStartTime: startTime,
        workEndTime: endTime,
      };
      await commands.saveEmergencyData(SCHEDULE_FILENAME, newData);
      queryClient.setQueryData(todayWorkScheduleQueryKey, newData);
    },
    [today, queryClient],
  );

  const clearSchedule = useCallback(async () => {
    await commands.saveEmergencyData(SCHEDULE_FILENAME, null);
    queryClient.setQueryData(todayWorkScheduleQueryKey, null);
  }, [queryClient]);

  return {
    schedule,
    isLoading,
    saveSchedule,
    clearSchedule,
  };
}
