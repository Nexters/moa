import { useState, useEffect } from 'react';

import type { UserSettings } from '~/lib/tauri-bindings';
import { timeToMinutes } from '~/lib/time';

// 기본 근무 설정
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]; // 월~금
const DEFAULT_WORK_START = '09:00';
const DEFAULT_WORK_END = '18:00';

/** 근무 상태 */
type WorkStatus = 'before-work' | 'working' | 'completed' | 'day-off';

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

export interface TodayTimeOverride {
  workStartTime: string;
  workEndTime: string;
}

export function useSalaryCalculator(
  settings: UserSettings | null,
  todayOverride?: TodayTimeOverride | null,
): SalaryInfo | null {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!settings || !settings.onboardingCompleted) return;

    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [settings, todayOverride]);

  return calculateSalaryInfo(settings, todayOverride);
}

function calculateSalaryInfo(
  settings: UserSettings | null,
  todayOverride?: TodayTimeOverride | null,
): SalaryInfo | null {
  if (!settings || !settings.onboardingCompleted) return null;

  const now = new Date();

  const workDays = settings.workDays ?? DEFAULT_WORK_DAYS;
  const workStartTime =
    todayOverride?.workStartTime ??
    settings.workStartTime ??
    DEFAULT_WORK_START;
  const workEndTime =
    todayOverride?.workEndTime ?? settings.workEndTime ?? DEFAULT_WORK_END;
  const workStartMinutes = timeToMinutes(workStartTime);
  const workEndMinutes = timeToMinutes(workEndTime);
  const workHoursPerDay = (workEndMinutes - workStartMinutes) / 60;

  const monthlySalary =
    settings.salaryType === 'yearly'
      ? settings.salaryAmount / 12
      : settings.salaryAmount;

  const payPeriod = getPayPeriod(now, settings.payDay);
  const workDaysInPeriod = getWorkDaysInPeriod(
    payPeriod.start,
    payPeriod.end,
    workDays,
  );

  const dailyRate = monthlySalary / workDaysInPeriod;
  const hourlyRate = dailyRate / workHoursPerDay;
  const perSecond = hourlyRate / 3600;

  const dayOfWeek = now.getDay();
  const isWorkDay = workDays.includes(dayOfWeek) || todayOverride != null;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let todayEarnings = 0;
  let workStatus: WorkStatus = 'day-off';

  if (isWorkDay) {
    if (currentMinutes < workStartMinutes) {
      workStatus = 'before-work';
      todayEarnings = 0;
    } else if (currentMinutes >= workEndMinutes) {
      workStatus = 'completed';
      todayEarnings = dailyRate;
    } else {
      workStatus = 'working';
      const workedMinutes = currentMinutes - workStartMinutes;
      const workedSeconds = workedMinutes * 60 + now.getSeconds();
      todayEarnings = perSecond * workedSeconds;
    }
  }

  const workedDays = getWorkedDaysSincePayDay(payPeriod.start, now, workDays);
  const accumulatedEarnings = workedDays * dailyRate + todayEarnings;

  return {
    dailyRate,
    hourlyRate,
    perSecond,
    accumulatedEarnings,
    todayEarnings,
    workStatus,
    isWorkDay,
    workedDays,
  };
}

// 헬퍼 함수들

/** 해당 월의 일수 반환 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 급여 주기 (이전 월급날 ~ 다음 월급날) 계산 */
function getPayPeriod(now: Date, payDay: number): { start: Date; end: Date } {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  let start: Date;
  let end: Date;

  if (day >= payDay) {
    // 이번 달 월급날 이후 → 이번 달 월급날 ~ 다음 달 월급날
    const startDay = Math.min(payDay, daysInMonth(year, month));
    const endDay = Math.min(payDay, daysInMonth(year, month + 1));
    start = new Date(year, month, startDay);
    end = new Date(year, month + 1, endDay);
  } else {
    // 이번 달 월급날 이전 → 지난 달 월급날 ~ 이번 달 월급날
    const startDay = Math.min(payDay, daysInMonth(year, month - 1));
    const endDay = Math.min(payDay, daysInMonth(year, month));
    start = new Date(year, month - 1, startDay);
    end = new Date(year, month, endDay);
  }

  return { start, end };
}

/** 기간 내 근무일수 계산 */
function getWorkDaysInPeriod(
  start: Date,
  end: Date,
  workDays: number[],
): number {
  let count = 0;
  const current = new Date(start);

  while (current < end) {
    if (workDays.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/** 월급날부터 어제까지 근무한 일수 */
function getWorkedDaysSincePayDay(
  payDayStart: Date,
  now: Date,
  workDays: number[],
): number {
  let count = 0;
  const current = new Date(payDayStart);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (current < today) {
    if (workDays.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
