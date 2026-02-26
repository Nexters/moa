/**
 * Re-export generated Tauri bindings with project conventions
 *
 * This file provides type-safe access to all Tauri commands.
 * Types are auto-generated from Rust by tauri-specta.
 *
 * @example
 * ```typescript
 * import { commands, unwrapResult } from '~/lib/tauri-bindings'
 *
 * // In TanStack Query - let errors propagate
 * const prefs = unwrapResult(await commands.loadPreferences())
 *
 * // In event handlers - explicit error handling
 * const result = await commands.savePreferences(prefs)
 * if (result.status === 'error') {
 *   toast.error(result.error)
 * }
 * ```
 *
 * @see docs/developer/tauri-commands.md for full documentation
 */

export { commands, type Result } from './tauri-bindings.gen';
export type {
  AppPreferences,
  JsonValue,
  MenubarDisplayMode,
  MenubarIconTheme,
  RecoveryError,
  SalaryType,
  UserSettings,
} from './tauri-bindings.gen';

/**
 * Helper to unwrap a Result type, throwing on error
 */
export function unwrapResult<T, E>(
  result: { status: 'ok'; data: T } | { status: 'error'; error: E },
): T {
  if (result.status === 'ok') {
    return result.data;
  }
  throw result.error;
}

// ---------------------------------------------------------------------------
// Onboarded user settings helpers
// ---------------------------------------------------------------------------

import type { UserSettings } from './tauri-bindings.gen';

/** 온보딩 완료 후 모든 optional 필드가 보장된 UserSettings */
export type OnboardedUserSettings = Required<UserSettings>;

/** 온보딩이 완료된 설정인지 런타임 검증 (미완료 시 에러) */
export function assertOnboarded(
  settings: UserSettings,
): asserts settings is OnboardedUserSettings {
  const required: (keyof UserSettings)[] = [
    'salaryType',
    'workDays',
    'workStartTime',
    'workEndTime',
  ];

  for (const key of required) {
    if (settings[key] == null) {
      throw new Error(
        `UserSettings.${key} is missing — onboarding may not be completed`,
      );
    }
  }
}
