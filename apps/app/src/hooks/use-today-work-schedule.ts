import { useCallback, useEffect, useState } from 'react';

import { commands } from '~/lib/tauri-bindings';

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
  const [scheduleData, setScheduleData] =
    useState<TodayWorkScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      const result = await commands.loadEmergencyData(SCHEDULE_FILENAME);
      if (result.status === 'ok') {
        const data = result.data as TodayWorkScheduleData | null;
        setScheduleData(data);
      }
      setIsLoading(false);
    };
    void loadSchedule();
  }, []);

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
      await commands.saveEmergencyData(SCHEDULE_FILENAME, {
        date: today,
        workStartTime: startTime,
        workEndTime: endTime,
      });
      setScheduleData({
        date: today,
        workStartTime: startTime,
        workEndTime: endTime,
      });
    },
    [today],
  );

  const clearSchedule = useCallback(async () => {
    await commands.saveEmergencyData(SCHEDULE_FILENAME, null);
    setScheduleData(null);
  }, []);

  return {
    schedule,
    isLoading,
    saveSchedule,
    clearSchedule,
  };
}
