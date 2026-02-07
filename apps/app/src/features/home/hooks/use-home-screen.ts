import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
import type { TodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { useTodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useVacation } from '~/hooks/use-vacation';
import { useWorkCompletedAck } from '~/hooks/use-work-completed-ack';
import {
  assertOnboarded,
  type OnboardedUserSettings,
} from '~/lib/tauri-bindings';
import { getCurrentTimeString, minutesToTime, timeToMinutes } from '~/lib/time';

// ============================================================================
// Types
// ============================================================================

export type HomeMainScreen =
  | { screen: 'vacation'; salaryInfo: SalaryInfo; onTodayWork: () => void }
  | { screen: 'day-off'; salaryInfo: SalaryInfo; onTodayWork: () => void }
  | {
      screen: 'before-work';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
      onVacation: () => void;
      onStartWork: () => void;
    }
  | {
      screen: 'working';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
      onEarlyLeave: () => void;
      onVacation: () => void;
    }
  | {
      screen: 'completed';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
      onAcknowledge: () => void;
    }
  | {
      screen: 'post-completed';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
    };

export interface HomeScreenState {
  isLoading: boolean;
  mainScreen: HomeMainScreen | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useHomeScreen(): HomeScreenState {
  const { data: settings, isLoading } = useUserSettings();
  const {
    schedule: todaySchedule,
    isLoading: scheduleLoading,
    saveSchedule,
  } = useTodayWorkSchedule();
  const salaryInfo = useSalaryCalculator(settings ?? null, todaySchedule);
  const {
    isOnVacation,
    isLoading: vacationLoading,
    clearVacation,
    setVacation,
  } = useVacation();
  const {
    isAcknowledged,
    isLoading: ackLoading,
    acknowledge,
  } = useWorkCompletedAck();

  // 로딩 체크
  const allLoading =
    isLoading || vacationLoading || ackLoading || scheduleLoading;

  if (allLoading || !settings || !salaryInfo) {
    return {
      isLoading: true,
      mainScreen: null,
    };
  }

  assertOnboarded(settings);

  const getEffectiveStartTime = () =>
    todaySchedule?.workStartTime ?? settings.workStartTime;

  const getEffectiveEndTime = () =>
    todaySchedule?.workEndTime ?? settings.workEndTime;

  // 핸들러
  const handleTodayWorkFromVacation = () => {
    void clearVacation();
    void saveSchedule(settings.workStartTime, settings.workEndTime);
  };

  const handleTodayWorkFromDayOff = () => {
    const now = getCurrentTimeString();
    const totalWorkMinutes =
      timeToMinutes(settings.workEndTime) -
      timeToMinutes(settings.workStartTime);
    const endTime = minutesToTime(timeToMinutes(now) + totalWorkMinutes);
    void saveSchedule(now, endTime);
  };

  const handleVacation = () => {
    void setVacation();
  };

  const handleStartWork = () => {
    const now = getCurrentTimeString();
    const originalStart = getEffectiveStartTime();
    const originalEnd = getEffectiveEndTime();
    const diffMinutes = timeToMinutes(originalStart) - timeToMinutes(now);

    if (diffMinutes <= 0) {
      void saveSchedule(originalStart, originalEnd);
      return;
    }

    const newEnd = minutesToTime(timeToMinutes(originalEnd) - diffMinutes);
    void saveSchedule(now, newEnd);
  };

  const handleEarlyLeave = () => {
    const now = getCurrentTimeString();
    const currentStart = getEffectiveStartTime();
    const currentEnd = getEffectiveEndTime();

    if (timeToMinutes(now) >= timeToMinutes(currentEnd)) {
      return;
    }

    void saveSchedule(currentStart, now);
  };

  const handleAcknowledge = () => {
    void acknowledge();
  };

  // 메인 스크린 결정
  const mainScreen = resolveMainScreen({
    isOnVacation,
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    onTodayWorkFromVacation: handleTodayWorkFromVacation,
    onTodayWorkFromDayOff: handleTodayWorkFromDayOff,
    onVacation: handleVacation,
    onStartWork: handleStartWork,
    onEarlyLeave: handleEarlyLeave,
    onAcknowledge: handleAcknowledge,
  });

  return {
    isLoading: false,
    mainScreen,
  };
}

interface ResolveParams {
  isOnVacation: boolean;
  salaryInfo: SalaryInfo;
  settings: OnboardedUserSettings;
  todaySchedule: TodayWorkSchedule | null;
  isAcknowledged: boolean;
  onTodayWorkFromVacation: () => void;
  onTodayWorkFromDayOff: () => void;
  onVacation: () => void;
  onStartWork: () => void;
  onEarlyLeave: () => void;
  onAcknowledge: () => void;
}

function resolveMainScreen(params: ResolveParams): HomeMainScreen {
  const {
    isOnVacation,
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    onTodayWorkFromVacation,
    onTodayWorkFromDayOff,
    onVacation,
    onStartWork,
    onEarlyLeave,
    onAcknowledge,
  } = params;

  // 휴가 우선 체크
  if (isOnVacation) {
    return {
      screen: 'vacation',
      salaryInfo,
      onTodayWork: onTodayWorkFromVacation,
    };
  }

  // 비근무일 (주말/출근하지 않는 요일)
  if (salaryInfo.workStatus === 'day-off') {
    return {
      screen: 'day-off',
      salaryInfo,
      onTodayWork: onTodayWorkFromDayOff,
    };
  }

  switch (salaryInfo.workStatus) {
    case 'before-work':
      return {
        screen: 'before-work',
        settings,
        salaryInfo,
        todaySchedule,
        onVacation,
        onStartWork,
      };
    case 'working':
      return {
        screen: 'working',
        settings,
        salaryInfo,
        todaySchedule,
        onEarlyLeave,
        onVacation,
      };
    case 'completed':
      if (isAcknowledged) {
        return {
          screen: 'post-completed',
          settings,
          salaryInfo,
          todaySchedule,
        };
      }
      return {
        screen: 'completed',
        settings,
        salaryInfo,
        todaySchedule,
        onAcknowledge,
      };
  }
}
