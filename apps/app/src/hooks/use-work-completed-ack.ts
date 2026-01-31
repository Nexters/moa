import { useCallback, useEffect, useState } from 'react';

import { commands } from '~/lib/tauri-bindings';

const ACK_FILENAME = 'work-completed-ack';

interface AckData {
  date: string;
}

interface WorkCompletedAckState {
  isAcknowledged: boolean;
  isLoading: boolean;
  acknowledge: () => Promise<void>;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useWorkCompletedAck(): WorkCompletedAckState {
  const [ackDate, setAckDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAck = async () => {
      const result = await commands.loadEmergencyData(ACK_FILENAME);
      if (result.status === 'ok') {
        const data = result.data as AckData | null;
        setAckDate(data?.date ?? null);
      }
      setIsLoading(false);
    };
    void loadAck();
  }, []);

  const today = getTodayString();
  const isAcknowledged = ackDate === today;

  const acknowledge = useCallback(async () => {
    await commands.saveEmergencyData(ACK_FILENAME, { date: today });
    setAckDate(today);
  }, [today]);

  return {
    isAcknowledged,
    isLoading,
    acknowledge,
  };
}
