import { useCallback, useEffect, useState } from 'react';

import { commands } from '~/lib/tauri-bindings';

const VACATION_FILENAME = 'vacation-state';

interface VacationData {
  date: string;
}

interface VacationState {
  isOnVacation: boolean;
  isLoading: boolean;
  setVacation: () => Promise<void>;
  clearVacation: () => Promise<void>;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useVacation(): VacationState {
  const [vacationDate, setVacationDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVacation = async () => {
      const result = await commands.loadEmergencyData(VACATION_FILENAME);
      if (result.status === 'ok') {
        const data = result.data as VacationData | null;
        setVacationDate(data?.date ?? null);
      }
      setIsLoading(false);
    };
    void loadVacation();
  }, []);

  const today = getTodayString();
  const isOnVacation = vacationDate === today;

  const setVacation = useCallback(async () => {
    await commands.saveEmergencyData(VACATION_FILENAME, { date: today });
    setVacationDate(today);
  }, [today]);

  const clearVacation = useCallback(async () => {
    await commands.saveEmergencyData(VACATION_FILENAME, null);
    setVacationDate(null);
  }, []);

  return {
    isOnVacation,
    isLoading,
    setVacation,
    clearVacation,
  };
}
