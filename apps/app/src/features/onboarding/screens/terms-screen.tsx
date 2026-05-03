import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useState } from 'react';
import { cn } from 'tailwind-variants';

import { posthog } from '~/lib/analytics';
import { commands } from '~/lib/tauri-bindings';
import { onboardingTermsQueryOptions, userSettingsQuery } from '~/queries';
import { AppBar, AppFooter, Button } from '~/ui';
import { CheckIcon, ChevronRightIcon } from '~/ui/icons';

import { useOnboardingContext } from '..';

export function TermsScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { goToPrevious } = useOnboardingContext();

  const termsQuery = useQuery(onboardingTermsQueryOptions.list());
  const terms = termsQuery.data ?? [];

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (code: string) =>
    setChecked((prev) => ({ ...prev, [code]: !prev[code] }));

  const allChecked = terms.length > 0 && terms.every((t) => checked[t.code]);

  const toggleAll = () => {
    const next = !allChecked;
    setChecked(Object.fromEntries(terms.map((t) => [t.code, next])));
  };

  const requiredAllChecked = terms
    .filter((t) => t.required)
    .every((t) => checked[t.code]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const result = await commands.submitOnboardingTermsAgreements(
        terms.map((t) => ({ code: t.code, agreed: !!checked[t.code] })),
      );
      if (result.status === 'error') throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userSettingsQuery.all() });
      void navigate({ to: '/onboarding/completion' });
    },
  });

  const handleOpenUrl = async (url: string) => {
    try {
      await openUrl(url);
    } catch (error) {
      posthog.captureException(error);
    }
  };

  const canSubmit =
    terms.length > 0 && requiredAllChecked && !submitMutation.isPending;

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={goToPrevious} />

      <div className="flex flex-1 flex-col px-6 pt-3">
        <h1 className="t2-700 text-text-high">약관에 동의해주세요</h1>
        <p className="b1-400 text-text-medium mt-3">
          서비스 이용을 위해 다음 약관에 동의해주세요.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={toggleAll}
            disabled={terms.length === 0}
            className="bg-container-primary flex items-center gap-3 rounded-md px-4 py-3.5 disabled:opacity-50"
            aria-pressed={allChecked}
          >
            <Checkbox checked={allChecked} />
            <span className="b1-600 text-text-high flex-1 text-left">
              전체 동의하기
            </span>
          </button>

          <ul className="flex flex-col gap-2">
            {terms.map((item) => {
              const isChecked = !!checked[item.code];
              const requiredLabel = item.required ? '(필수)' : '(선택)';

              return (
                <li
                  key={item.code}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.code)}
                    aria-pressed={isChecked}
                    aria-label={`${item.title} 동의`}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <Checkbox checked={isChecked} />
                    <span className="b2-500 text-text-medium">
                      {requiredLabel} {item.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenUrl(item.contentUrl)}
                    aria-label={`${item.title} 자세히 보기`}
                    className="cursor-pointer"
                  >
                    <ChevronRightIcon className="text-text-low size-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <AppFooter>
          {submitMutation.isError && (
            <p className="b2-400 text-error">
              저장에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          <Button
            rounded="full"
            size="lg"
            className="w-60"
            disabled={!canSubmit}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? '저장 중...' : '다음'}
          </Button>
        </AppFooter>
      </div>
    </main>
  );
}

interface CheckboxProps {
  checked: boolean;
}

function Checkbox({ checked }: CheckboxProps) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors',
        checked
          ? 'bg-green-40 border-green-40 text-gray-90'
          : 'border-text-low text-transparent',
      )}
      aria-hidden="true"
    >
      <CheckIcon className="size-4" />
    </span>
  );
}
