import { useState } from 'react';

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

// ============================================================================
// Types
// ============================================================================

export type HomeMainScreen =
  | { screen: 'holiday'; salaryInfo: SalaryInfo; onTodayWork: () => void }
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
      onCompleteWork: () => void;
      onVacation: () => void;
    }
  | {
      screen: 'completed';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      onCompleteWork: () => void;
    }
  | {
      screen: 'post-completed';
      settings: OnboardedUserSettings;
      salaryInfo: SalaryInfo;
      todaySchedule: TodayWorkSchedule | null;
    };

export interface AdjustWorkTimeState {
  isOpen: boolean;
  defaultStartTime: string;
  defaultEndTime: string;
  onConfirm: (startTime: string, endTime: string) => Promise<void>;
  onBack: () => void;
}

export interface HomeScreenState {
  isLoading: boolean;
  mainScreen: HomeMainScreen | null;
  adjustWorkTime: AdjustWorkTimeState;
}

// ============================================================================
// Hook
// ============================================================================

export function useHomeScreen(): HomeScreenState {
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

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
    setVacation,
    clearVacation,
  } = useVacation();
  const {
    isAcknowledged,
    isLoading: ackLoading,
    acknowledge,
  } = useWorkCompletedAck();

  // 핸들러
  const handleTodayWork = () => {
    void clearVacation();
    setIsAdjustOpen(true);
  };

  const handleVacation = () => {
    void setVacation();
  };

  const handleStartWork = () => {
    setIsAdjustOpen(true);
  };

  const handleCompleteWork = () => {
    void acknowledge();
  };

  const handleConfirmWorkTime = async (startTime: string, endTime: string) => {
    await saveSchedule(startTime, endTime);
    setIsAdjustOpen(false);
  };

  const handleBackFromAdjust = () => {
    setIsAdjustOpen(false);
  };

  // 로딩 체크
  const allLoading =
    isLoading || vacationLoading || ackLoading || scheduleLoading;

  if (allLoading || !settings || !salaryInfo) {
    return {
      isLoading: true,
      mainScreen: null,
      adjustWorkTime: {
        isOpen: false,
        defaultStartTime: '09:00',
        defaultEndTime: '18:00',
        onConfirm: handleConfirmWorkTime,
        onBack: handleBackFromAdjust,
      },
    };
  }

  assertOnboarded(settings);

  // adjustWorkTime 기본 시간값
  const defaultStartTime =
    todaySchedule?.workStartTime ?? settings.workStartTime;
  const defaultEndTime = todaySchedule?.workEndTime ?? settings.workEndTime;

  // 메인 스크린 결정
  const mainScreen = resolveMainScreen({
    isOnVacation,
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    onTodayWork: handleTodayWork,
    onVacation: handleVacation,
    onStartWork: handleStartWork,
    onCompleteWork: handleCompleteWork,
  });

  return {
    isLoading: false,
    mainScreen,
    adjustWorkTime: {
      isOpen: isAdjustOpen,
      defaultStartTime,
      defaultEndTime,
      onConfirm: handleConfirmWorkTime,
      onBack: handleBackFromAdjust,
    },
  };
}

interface ResolveParams {
  isOnVacation: boolean;
  salaryInfo: SalaryInfo;
  settings: OnboardedUserSettings;
  todaySchedule: TodayWorkSchedule | null;
  isAcknowledged: boolean;
  onTodayWork: () => void;
  onVacation: () => void;
  onStartWork: () => void;
  onCompleteWork: () => void;
}

function resolveMainScreen(params: ResolveParams): HomeMainScreen {
  const {
    isOnVacation,
    salaryInfo,
    settings,
    todaySchedule,
    isAcknowledged,
    onTodayWork,
    onVacation,
    onStartWork,
    onCompleteWork,
  } = params;

  // 휴가 우선 체크
  if (isOnVacation || salaryInfo.workStatus === 'day-off') {
    return { screen: 'holiday', salaryInfo, onTodayWork };
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
        onCompleteWork,
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
        onCompleteWork,
      };
  }
}
