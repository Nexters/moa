import { useMutation } from '@tanstack/react-query';

import type { SalaryInfo } from '~/hooks/use-salary-tick';
import { useSalaryTick, waitForSalaryTick } from '~/hooks/use-salary-tick';
import type { TodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { useTodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useVacation } from '~/hooks/use-vacation';
import { useWorkCompletedAck } from '~/hooks/use-work-completed-ack';
import {
  assertOnboarded,
  type OnboardedUserSettings,
} from '~/lib/tauri-bindings';
import {
  getCurrentTimeString,
  minutesToTime,
  normalizeOvernightMinutes,
  timeToMinutes,
} from '~/lib/time';

// ============================================================================
// Types
// ============================================================================

export type HomeMainScreen =
  | {
      screen: 'vacation';
      salaryInfo: SalaryInfo;
      isPending?: boolean;
      onTodayWork: () => void;
    }
  | {
      screen: 'day-off';
      salaryInfo: SalaryInfo;
      isPending?: boolean;
      onTodayWork: () => void;
    }
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
      isEarlyLeavePending: boolean;
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
      onStillWorking?: () => void;
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
    isSaving,
    saveSchedule,
    clearSchedule,
  } = useTodayWorkSchedule();
  const {
    isOnVacation,
    isLoading: vacationLoading,
    clearVacation,
    setVacation,
  } = useVacation();
  const salaryInfo = useSalaryTick();
  const {
    isAcknowledged,
    isLoading: ackLoading,
    acknowledge,
    clearAcknowledge,
  } = useWorkCompletedAck();

  const todayWorkMutation = useMutation({
    mutationFn: async ({
      startTime,
      endTime,
      withVacationClear,
    }: {
      startTime: string;
      endTime: string;
      withVacationClear: boolean;
    }) => {
      if (withVacationClear) {
        await Promise.all([clearVacation(), saveSchedule(startTime, endTime)]);
      } else {
        await saveSchedule(startTime, endTime);
      }
      await waitForSalaryTick((info) => info.workStatus !== 'day-off');
    },
  });

  const stillWorkingMutation = useMutation({
    mutationFn: async () => {
      await clearSchedule();
      await clearAcknowledge();
      await waitForSalaryTick((info) => info.workStatus === 'working');
    },
  });

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
    todayWorkMutation.mutate({
      startTime: settings.workStartTime,
      endTime: settings.workEndTime,
      withVacationClear: true,
    });
  };

  const handleTodayWorkFromDayOff = () => {
    const now = getCurrentTimeString();
    const startMin = timeToMinutes(settings.workStartTime);
    const endMin = timeToMinutes(settings.workEndTime);
    const { normalizedEnd } = normalizeOvernightMinutes(startMin, endMin, 0);
    const totalWorkMinutes = normalizedEnd - startMin;
    const endTime = minutesToTime(timeToMinutes(now) + totalWorkMinutes);
    todayWorkMutation.mutate({
      startTime: now,
      endTime,
      withVacationClear: false,
    });
  };

  const handleVacation = () => {
    void setVacation();
  };

  const handleStartWork = () => {
    const now = getCurrentTimeString();
    const originalStart = getEffectiveStartTime();
    const originalEnd = getEffectiveEndTime();
    const startMin = timeToMinutes(originalStart);
    const endMin = timeToMinutes(originalEnd);
    const nowMin = timeToMinutes(now);
    const { normalizedEnd } = normalizeOvernightMinutes(startMin, endMin, 0);
    const diffMinutes = startMin - nowMin;

    if (diffMinutes <= 0) {
      void saveSchedule(originalStart, originalEnd);
      return;
    }

    const newEnd = minutesToTime(normalizedEnd - diffMinutes);
    void saveSchedule(now, newEnd);
  };

  const handleEarlyLeave = () => {
    const now = getCurrentTimeString();
    const currentStart = getEffectiveStartTime();
    const currentEnd = getEffectiveEndTime();
    const { normalizedEnd, normalizedNow } = normalizeOvernightMinutes(
      timeToMinutes(currentStart),
      timeToMinutes(currentEnd),
      timeToMinutes(now),
    );

    if (normalizedNow >= normalizedEnd) {
      return;
    }

    void saveSchedule(currentStart, now);
  };

  const handleAcknowledge = () => {
    void acknowledge();
  };

  const handleStillWorking = () => {
    stillWorkingMutation.mutate();
  };

  // 화면 전환 중 → 현재 화면 유지 (Rust 응답 대기)
  if (todayWorkMutation.isPending) {
    const fromVacation = todayWorkMutation.variables?.withVacationClear;
    if (fromVacation) {
      return {
        isLoading: false,
        mainScreen: {
          screen: 'vacation' as const,
          salaryInfo,
          isPending: true,
          onTodayWork: () => {},
        },
      };
    }
    return {
      isLoading: false,
      mainScreen: {
        screen: 'day-off' as const,
        salaryInfo,
        isPending: true,
        onTodayWork: () => {},
      },
    };
  }

  if (stillWorkingMutation.isPending) {
    return {
      isLoading: false,
      mainScreen: {
        screen: 'working' as const,
        settings,
        salaryInfo,
        todaySchedule,
        isEarlyLeavePending: false,
        onEarlyLeave: handleEarlyLeave,
        onVacation: handleVacation,
      },
    };
  }

  // 메인 스크린 결정
  const mainScreen = resolveMainScreen({
    isOnVacation,
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    isSaving,
    onTodayWorkFromVacation: handleTodayWorkFromVacation,
    onTodayWorkFromDayOff: handleTodayWorkFromDayOff,
    onVacation: handleVacation,
    onStartWork: handleStartWork,
    onEarlyLeave: handleEarlyLeave,
    onAcknowledge: handleAcknowledge,
    onStillWorking: handleStillWorking,
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
  isSaving: boolean;
  onTodayWorkFromVacation: () => void;
  onTodayWorkFromDayOff: () => void;
  onVacation: () => void;
  onStartWork: () => void;
  onEarlyLeave: () => void;
  onAcknowledge: () => void;
  onStillWorking: () => void;
}

function resolveMainScreen(params: ResolveParams): HomeMainScreen {
  const {
    isOnVacation,
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    isSaving,
    onTodayWorkFromVacation,
    onTodayWorkFromDayOff,
    onVacation,
    onStartWork,
    onEarlyLeave,
    onAcknowledge,
    onStillWorking,
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
        isEarlyLeavePending: isSaving,
        onEarlyLeave,
        onVacation,
      };
    case 'completed':
      if (isAcknowledged) {
        const now = getCurrentTimeString();
        const { normalizedEnd, normalizedNow } = normalizeOvernightMinutes(
          timeToMinutes(settings.workStartTime),
          timeToMinutes(settings.workEndTime),
          timeToMinutes(now),
        );
        const isBeforeOriginalEnd = normalizedNow < normalizedEnd;
        return {
          screen: 'post-completed',
          settings,
          salaryInfo,
          todaySchedule,
          ...(isBeforeOriginalEnd && { onStillWorking }),
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
