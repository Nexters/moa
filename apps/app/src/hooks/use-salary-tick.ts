import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

/** 근무 상태 */
export type WorkStatus = 'before-work' | 'working' | 'completed' | 'day-off';

export interface SalaryInfo {
  /** 일급 (원) */
  dailyRate: number;
  /** 시급 (원) */
  hourlyRate: number;
  /** 초당 금액 (원) */
  perSecond: number;
  /** 월급날부터 누적 금액 (원) */
  accumulatedEarnings: number;
  /** 오늘 번 금액 (원) */
  todayEarnings: number;
  /** 근무 상태 */
  workStatus: WorkStatus;
  /** 오늘이 근무일인지 */
  isWorkDay: boolean;
  /** 월급날부터 근무한 일수 */
  workedDays: number;
}

let cachedInfo: SalaryInfo | null = null;

/**
 * Rust 백그라운드 타이머에서 매초 발행하는 salary-tick 이벤트를 구독.
 * 메뉴바와 UI가 동일한 계산 결과를 사용하도록 보장.
 */
export function useSalaryTick(): SalaryInfo | null {
  const [info, setInfo] = useState<SalaryInfo | null>(cachedInfo);

  useEffect(() => {
    const unlisten = listen<SalaryInfo>('salary-tick', (event) => {
      cachedInfo = event.payload;
      setInfo(event.payload);
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  return info;
}
