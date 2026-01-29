import { useState, useEffect } from 'react';

import type { UserSettings } from '~/lib/tauri-bindings';

// 기본 근무 설정
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]; // 월~금
const DEFAULT_WORK_START = '09:00';
const DEFAULT_WORK_END = '18:00';

/** 시간 문자열을 분으로 변환 (HH:MM -> minutes) */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

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

      // 설정에서 근무 정보 가져오기 (기본값 사용)
      const workDays = settings.workDays ?? DEFAULT_WORK_DAYS;
      const workStartTime = settings.workStartTime ?? DEFAULT_WORK_START;
      const workEndTime = settings.workEndTime ?? DEFAULT_WORK_END;
      const workStartMinutes = timeToMinutes(workStartTime);
      const workEndMinutes = timeToMinutes(workEndTime);
      const workHoursPerDay = (workEndMinutes - workStartMinutes) / 60;

      // 연봉인 경우 월급으로 변환 (12로 나눔)
      const monthlySalary =
        settings.salaryType === 'yearly'
          ? settings.salaryAmount / 12
          : settings.salaryAmount;

      // 1. 이번 급여 주기의 월 근무일수 계산
      const payPeriod = getPayPeriod(now, settings.payDay);
      const workDaysInPeriod = getWorkDaysInPeriod(
        payPeriod.start,
        payPeriod.end,
        workDays,
      );

      // 2. 일급, 시급, 초당 금액 계산
      const dailyRate = monthlySalary / workDaysInPeriod;
      const hourlyRate = dailyRate / workHoursPerDay;
      const perSecond = hourlyRate / 3600;

      // 3. 오늘 근무 상태 확인
      const dayOfWeek = now.getDay();
      const isWorkDay = workDays.includes(dayOfWeek);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // 4. 오늘 번 금액 계산
      let todayEarnings = 0;
      let workStatus: WorkStatus = 'day-off';

      if (isWorkDay) {
        if (currentMinutes < workStartMinutes) {
          // 출근 전
          workStatus = 'not-working';
          todayEarnings = 0;
        } else if (currentMinutes >= workEndMinutes) {
          // 퇴근 후
          workStatus = 'not-working';
          todayEarnings = dailyRate;
        } else {
          // 근무 중
          workStatus = 'working';
          const workedMinutes = currentMinutes - workStartMinutes;
          const workedSeconds = workedMinutes * 60 + now.getSeconds();
          todayEarnings = perSecond * workedSeconds;
        }
      }

      // 5. 월급날부터 어제까지 근무한 일수
      const workedDays = getWorkedDaysSincePayDay(
        payPeriod.start,
        now,
        workDays,
      );

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
