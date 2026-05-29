import { useMutation } from '@tanstack/react-query';

import type { SalaryInfo } from '~/hooks/use-salary-tick';
import {
  useSalaryTick,
  waitForNextSalaryTick,
  waitForSalaryTick,
} from '~/hooks/use-salary-tick';
import type { TodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import { useTodayWorkSchedule } from '~/hooks/use-today-work-schedule';
import type { TodayWorkStatus } from '~/hooks/use-today-work-status';
import { useTodayWorkStatus } from '~/hooks/use-today-work-status';
import { useUserSettings } from '~/hooks/use-user-settings';
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
      screen: 'non-working';
      status: TodayWorkStatus;
      salaryInfo: SalaryInfo;
      isPending?: boolean;
      onTodayWork: () => void;
    }
  | {
      screen: 'before-work';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
      isPending?: boolean;
      onVacation: () => void;
      onStartWork: () => void;
    }
  | {
      screen: 'working';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
      isPending?: boolean;
      onEarlyLeave: () => void;
      onVacation: () => void;
    }
  | {
      screen: 'completed';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
      isPending?: boolean;
      onAcknowledge: () => void;
      onAdjustSchedule: (startTime: string, endTime: string) => Promise<void>;
      onExtendWork: (newEndTime: string) => Promise<void>;
    }
  | {
      screen: 'post-completed';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
      onAdjustSchedule: (startTime: string, endTime: string) => Promise<void>;
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
    saveSchedule,
  } = useTodayWorkSchedule();
  const {
    isLoading: workStatusLoading,
    clearStatus,
    saveStatus,
  } = useTodayWorkStatus();
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
      withStatusClear,
    }: {
      startTime: string;
      endTime: string;
      withStatusClear: boolean;
    }) => {
      if (withStatusClear) {
        await Promise.all([clearStatus(), saveSchedule(startTime, endTime)]);
      } else {
        await saveSchedule(startTime, endTime);
      }
      await waitForSalaryTick(
        (info) =>
          info.workStatus !== 'annual-leave' &&
          info.workStatus !== 'day-off' &&
          info.workStatus !== 'public-holiday',
      );
    },
  });

  const stillWorkingMutation = useMutation({
    mutationFn: async ({
      startTime,
      endTime,
    }: {
      startTime: string;
      endTime: string;
    }) => {
      await Promise.all([saveSchedule(startTime, endTime), clearAcknowledge()]);
      await waitForNextSalaryTick();
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: async ({
      startTime,
      endTime,
    }: {
      startTime: string;
      endTime: string;
    }) => {
      await saveSchedule(startTime, endTime);
      await waitForNextSalaryTick();
    },
  });

  const earlyLeaveMutation = useMutation({
    mutationFn: async ({
      startTime,
      endTime,
    }: {
      startTime: string;
      endTime: string;
    }) => {
      await saveSchedule(startTime, endTime);
      await waitForNextSalaryTick();
    },
  });

  const workStatusMutation = useMutation({
    mutationFn: async (_vars: {
      fromScreen: 'before-work' | 'working';
      status: TodayWorkStatus;
    }) => {
      await saveStatus(_vars.status);
      await waitForSalaryTick((info) => info.workStatus === _vars.status);
    },
  });

  // 로딩 체크
  const allLoading =
    isLoading || workStatusLoading || ackLoading || scheduleLoading;

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
  const handleTodayWorkFromNonWorking = () => {
    if (!salaryInfo.isWorkDay) {
      handleTodayWorkFromDayOff();
      return;
    }

    todayWorkMutation.mutate({
      startTime: settings.workStartTime,
      endTime: settings.workEndTime,
      withStatusClear: true,
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
      withStatusClear: true,
    });
  };

  const handleVacationFromBeforeWork = () => {
    workStatusMutation.mutate({
      fromScreen: 'before-work',
      status: 'annual-leave',
    });
  };

  const handleVacationFromWorking = () => {
    workStatusMutation.mutate({
      fromScreen: 'working',
      status: 'annual-leave',
    });
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
      startWorkMutation.mutate({
        startTime: originalStart,
        endTime: originalEnd,
      });
      return;
    }

    const newEnd = minutesToTime(normalizedEnd - diffMinutes);
    startWorkMutation.mutate({ startTime: now, endTime: newEnd });
  };

  const handleEarlyLeave = () => {
    const now = getCurrentTimeString();
    const currentStart = getEffectiveStartTime();
    const currentEnd = getEffectiveEndTime();
    const startMin = timeToMinutes(currentStart);
    const nowMin = timeToMinutes(now);
    const { normalizedEnd, normalizedNow } = normalizeOvernightMinutes(
      startMin,
      timeToMinutes(currentEnd),
      nowMin,
    );

    if (normalizedNow >= normalizedEnd) {
      return;
    }

    earlyLeaveMutation.mutate({
      startTime: currentStart,
      endTime: now,
    });
  };

  const handleAcknowledge = () => {
    void acknowledge();
  };

  const handleStillWorking = () => {
    stillWorkingMutation.mutate({
      startTime: getEffectiveStartTime(),
      endTime: settings.workEndTime,
    });
  };

  const handleAdjustScheduleFromCompleted = async (
    startTime: string,
    endTime: string,
  ) => {
    await stillWorkingMutation.mutateAsync({ startTime, endTime });
  };

  const handleExtendWork = async (newEndTime: string) => {
    await stillWorkingMutation.mutateAsync({
      startTime: getEffectiveStartTime(),
      endTime: newEndTime,
    });
  };

  // 화면 전환 중 → 현재 화면 유지 (Rust 응답 대기)
  if (todayWorkMutation.isPending) {
    return {
      isLoading: false,
      mainScreen: {
        screen: 'non-working' as const,
        status: getNonWorkingStatus(salaryInfo.workStatus),
        salaryInfo,
        isPending: true,
        onTodayWork: () => {},
      },
    };
  }

  if (stillWorkingMutation.isPending) {
    if (isAcknowledged) {
      return {
        isLoading: false,
        mainScreen: {
          screen: 'completed' as const,
          settings,
          salaryInfo,
          todaySchedule,
          isPending: true,
          onAcknowledge: () => {},
          onAdjustSchedule: async () => {},
          onExtendWork: async () => {},
        },
      };
    }
    return {
      isLoading: false,
      mainScreen: {
        screen: 'working' as const,
        settings,
        salaryInfo,
        todaySchedule,
        isPending: true,
        onEarlyLeave: () => {},
        onVacation: () => {},
      },
    };
  }

  if (startWorkMutation.isPending) {
    return {
      isLoading: false,
      mainScreen: {
        screen: 'before-work' as const,
        settings,
        salaryInfo,
        todaySchedule,
        isPending: true,
        onVacation: () => {},
        onStartWork: () => {},
      },
    };
  }

  if (earlyLeaveMutation.isPending) {
    return {
      isLoading: false,
      mainScreen: {
        screen: 'working' as const,
        settings,
        salaryInfo,
        todaySchedule,
        isPending: true,
        onEarlyLeave: () => {},
        onVacation: () => {},
      },
    };
  }

  if (workStatusMutation.isPending) {
    const fromScreen = workStatusMutation.variables?.fromScreen;
    if (fromScreen === 'working') {
      return {
        isLoading: false,
        mainScreen: {
          screen: 'working' as const,
          settings,
          salaryInfo,
          todaySchedule,
          isPending: true,
          onEarlyLeave: () => {},
          onVacation: () => {},
        },
      };
    }

    return {
      isLoading: false,
      mainScreen: {
        screen: 'before-work' as const,
        settings,
        salaryInfo,
        todaySchedule,
        isPending: true,
        onVacation: () => {},
        onStartWork: () => {},
      },
    };
  }

  // 메인 스크린 결정
  const mainScreen = resolveMainScreen({
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    onTodayWorkFromNonWorking: handleTodayWorkFromNonWorking,
    onVacationFromBeforeWork: handleVacationFromBeforeWork,
    onVacationFromWorking: handleVacationFromWorking,
    onStartWork: handleStartWork,
    onEarlyLeave: handleEarlyLeave,
    onAcknowledge: handleAcknowledge,
    onStillWorking: handleStillWorking,
    onAdjustScheduleFromCompleted: handleAdjustScheduleFromCompleted,
    onExtendWork: handleExtendWork,
  });

  return {
    isLoading: false,
    mainScreen,
  };
}

interface ResolveParams {
  salaryInfo: SalaryInfo;
  settings: OnboardedUserSettings;
  todaySchedule: TodayWorkSchedule | null;
  isAcknowledged: boolean;
  onTodayWorkFromNonWorking: () => void;
  onVacationFromBeforeWork: () => void;
  onVacationFromWorking: () => void;
  onStartWork: () => void;
  onEarlyLeave: () => void;
  onAcknowledge: () => void;
  onStillWorking: () => void;
  onAdjustScheduleFromCompleted: (
    startTime: string,
    endTime: string,
  ) => Promise<void>;
  onExtendWork: (newEndTime: string) => Promise<void>;
}

function isNonWorkingStatus(
  status: SalaryInfo['workStatus'],
): status is TodayWorkStatus {
  return (
    status === 'annual-leave' ||
    status === 'day-off' ||
    status === 'public-holiday'
  );
}

function getNonWorkingStatus(
  status: SalaryInfo['workStatus'],
): TodayWorkStatus {
  return isNonWorkingStatus(status) ? status : 'day-off';
}

function resolveMainScreen(params: ResolveParams): HomeMainScreen {
  const {
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    onTodayWorkFromNonWorking,
    onVacationFromBeforeWork,
    onVacationFromWorking,
    onStartWork,
    onEarlyLeave,
    onAcknowledge,
    onStillWorking,
    onAdjustScheduleFromCompleted,
    onExtendWork,
  } = params;

  if (isNonWorkingStatus(salaryInfo.workStatus)) {
    return {
      screen: 'non-working',
      status: salaryInfo.workStatus,
      salaryInfo,
      onTodayWork: onTodayWorkFromNonWorking,
    };
  }

  switch (salaryInfo.workStatus) {
    case 'before-work':
      return {
        screen: 'before-work',
        settings,
        salaryInfo,
        todaySchedule,
        onVacation: onVacationFromBeforeWork,
        onStartWork,
      };
    case 'working':
      return {
        screen: 'working',
        settings,
        salaryInfo,
        todaySchedule,
        onEarlyLeave,
        onVacation: onVacationFromWorking,
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
          onAdjustSchedule: onAdjustScheduleFromCompleted,
          ...(isBeforeOriginalEnd && { onStillWorking }),
        };
      }
      return {
        screen: 'completed',
        settings,
        salaryInfo,
        todaySchedule,
        onAcknowledge,
        onAdjustSchedule: onAdjustScheduleFromCompleted,
        onExtendWork,
      };
  }
}
