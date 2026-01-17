import { useState, useEffect } from 'react';

import type { UserSettings } from '~/lib/tauri-bindings';

// 근무 설정 상수
const WORK_DAYS = [1, 2, 3, 4, 5]; // 월~금
const WORK_START_MINUTES = 9 * 60; // 09:00
const WORK_END_MINUTES = 18 * 60; // 18:00
const WORK_HOURS_PER_DAY = 9;

/** 근무 상태 */
type WorkStatus = 'working' | 'not-working' | 'day-off';

interface SalaryInfo {
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

export type { SalaryInfo, WorkStatus };

export function useSalaryCalculator(
  settings: UserSettings | null,
): SalaryInfo | null {
  const [info, setInfo] = useState<SalaryInfo | null>(null);

  useEffect(() => {
    if (!settings || !settings.onboardingCompleted) {
      setInfo(null);
      return;
    }

    const calculate = () => {
      const now = new Date();

      // 1. 이번 급여 주기의 월 근무일수 계산
      const payPeriod = getPayPeriod(now, settings.payDay);
      const workDaysInPeriod = getWorkDaysInPeriod(
        payPeriod.start,
        payPeriod.end,
      );

      // 2. 일급, 시급, 초당 금액 계산
      const dailyRate = settings.monthlyNetSalary / workDaysInPeriod;
      const hourlyRate = dailyRate / WORK_HOURS_PER_DAY;
      const perSecond = hourlyRate / 3600;

      // 3. 오늘 근무 상태 확인
      const dayOfWeek = now.getDay();
      const isWorkDay = WORK_DAYS.includes(dayOfWeek);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // 4. 오늘 번 금액 계산
      let todayEarnings = 0;
      let workStatus: WorkStatus = 'day-off';

      if (isWorkDay) {
        if (currentMinutes < WORK_START_MINUTES) {
          // 출근 전
          workStatus = 'not-working';
          todayEarnings = 0;
        } else if (currentMinutes >= WORK_END_MINUTES) {
          // 퇴근 후
          workStatus = 'not-working';
          todayEarnings = dailyRate;
        } else {
          // 근무 중
          workStatus = 'working';
          const workedMinutes = currentMinutes - WORK_START_MINUTES;
          const workedSeconds = workedMinutes * 60 + now.getSeconds();
          todayEarnings = perSecond * workedSeconds;
        }
      }

      // 5. 월급날부터 어제까지 근무한 일수
      const workedDays = getWorkedDaysSincePayDay(payPeriod.start, now);

      // 6. 누적 금액 계산
      const accumulatedEarnings = workedDays * dailyRate + todayEarnings;

      setInfo({
        dailyRate,
        hourlyRate,
        perSecond,
        accumulatedEarnings,
        todayEarnings,
        workStatus,
        isWorkDay,
        workedDays,
      });
    };

    // 초기 계산
    calculate();

    // 1초마다 업데이트
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [settings]);

  return info;
}

// 헬퍼 함수들

/** 급여 주기 (이전 월급날 ~ 다음 월급날) 계산 */
function getPayPeriod(now: Date, payDay: number): { start: Date; end: Date } {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  let start: Date;
  let end: Date;

  if (day >= payDay) {
    // 이번 달 월급날 이후 → 이번 달 월급날 ~ 다음 달 월급날
    start = new Date(year, month, payDay);
    end = new Date(year, month + 1, payDay);
  } else {
    // 이번 달 월급날 이전 → 지난 달 월급날 ~ 이번 달 월급날
    start = new Date(year, month - 1, payDay);
    end = new Date(year, month, payDay);
  }

  return { start, end };
}

/** 기간 내 근무일수 계산 */
function getWorkDaysInPeriod(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current < end) {
    if (WORK_DAYS.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/** 월급날부터 어제까지 근무한 일수 */
function getWorkedDaysSincePayDay(payDayStart: Date, now: Date): number {
  let count = 0;
  const current = new Date(payDayStart);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (current < today) {
    if (WORK_DAYS.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
