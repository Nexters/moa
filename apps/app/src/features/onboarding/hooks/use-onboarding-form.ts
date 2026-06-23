import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import { generateRandomNickname } from '~/features/settings/lib/nickname-pool';
import { useAuthStatus } from '~/hooks/use-auth';
import { commands, type SalaryType } from '~/lib/tauri-bindings';
import { authQuery, userSettingsQuery } from '~/queries';

export const SALARY_TYPE_OPTIONS = [
  { value: 'yearly', label: '연봉' },
  { value: 'monthly', label: '월급' },
] as const satisfies { value: SalaryType; label: string }[];

export interface OnboardingFormValues {
  salaryType: SalaryType;
  salaryAmount: number;
  payDay: number;
  workDays: number[];
  workStartTime: string;
  workEndTime: string;
}

const DEFAULT_VALUES: OnboardingFormValues = {
  salaryType: SALARY_TYPE_OPTIONS[0].value,
  salaryAmount: 36_000_000,
  payDay: 25,
  workDays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '18:00',
};

interface UseOnboardingFormOptions {
  onSuccess: () => void;
}

export function useOnboardingForm({ onSuccess }: UseOnboardingFormOptions) {
  const queryClient = useQueryClient();
  const { data: authStatus } = useAuthStatus();
  const isLoggedIn = authStatus?.isLoggedIn === true;

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: async ({ value }) => {
      if (!isLoggedIn) {
        // 게스트: 서버 온보딩(complete_onboarding)은 토큰이 필요하므로 스킵하고
        // 로컬 settings 만 1회 저장한다. onboardingCompleted=true 로 바로 굳혀도
        // 서버 호출 실패로 인한 재시도 봉쇄 위험이 없다.
        const saved = await commands.saveUserSettings({
          ...value,
          onboardingCompleted: true,
        });
        if (saved.status === 'error') {
          throw new Error(saved.error);
        }
      } else {
        // 로그인 사용자: 로컬 저장 → 서버 등록 → 로컬 완료 플래그 순서.
        // 1) form 데이터만 로컬에 먼저 저장. onboardingCompleted 는 일부러 false 로 둠.
        //    이 단계에서 true 로 굳히면 completeOnboarding 가 중간에 실패해도
        //    panel-open listener 가 isOnboardingCompleted=true 를 보고 /home 으로
        //    끌고 가, 사용자가 온보딩을 재시도할 길이 막힌다.
        const saved = await commands.saveUserSettings({
          ...value,
          onboardingCompleted: false,
        });
        if (saved.status === 'error') {
          throw new Error(saved.error);
        }

        // 2) 서버 온보딩 등록. 서버에 닉네임이 이미 있으면 보존하고,
        //    없을 때만 자동 생성한다(reset 후 재온보딩 시 기존 닉네임 덮어쓰기 방지).
        const existing = await commands.getProfileNickname();
        const existingNickname =
          existing.status === 'ok' ? (existing.data ?? '').trim() : '';
        const nickname =
          existingNickname !== '' ? existingNickname : generateRandomNickname();

        const completeResult = await commands.completeOnboarding(nickname);
        if (completeResult.status === 'error') {
          throw new Error(completeResult.error);
        }

        // 3) 서버 등록이 확인된 후에만 로컬 완료 플래그를 켠다.
        const flipped = await commands.saveUserSettings({
          ...value,
          onboardingCompleted: true,
        });
        if (flipped.status === 'error') {
          throw new Error(flipped.error);
        }
      }

      await queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
      await queryClient.invalidateQueries({
        queryKey: authQuery.all(),
      });
      void commands.notifySettingsChanged();
      onSuccess();
    },
  });

  return form;
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
