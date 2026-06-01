import type { WorkdaySchedule } from '~/hooks/use-workday';
import type { OnboardedUserSettings } from '~/lib/tauri-bindings';
import type { TimePeriodValue } from '~/ui/time-period-input';

/**
 * 오늘 일정(override)이 있으면 그 근무 시간을, 없으면 기본 settings 근무 시간을
 * 사용한다. home 화면 전반에서 반복되던 `todaySchedule?.workX ?? settings.workX`
 * 폴백 파생을 한 곳으로 모은 것.
 */
export function getEffectiveWorkTime(
  todaySchedule: WorkdaySchedule | null,
  settings: OnboardedUserSettings,
): TimePeriodValue {
  return {
    startTime: todaySchedule?.workStartTime ?? settings.workStartTime,
    endTime: todaySchedule?.workEndTime ?? settings.workEndTime,
  };
}
