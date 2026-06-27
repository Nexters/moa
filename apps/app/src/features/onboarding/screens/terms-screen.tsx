import { useForm } from '@tanstack/react-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { openUrl } from '@tauri-apps/plugin-opener';

import { posthog } from '~/lib/analytics';
import {
  commands,
  type TermAgreementInput,
  type TermItem,
} from '~/lib/tauri-bindings';
import { onboardingTermsQueryOptions, userSettingsQuery } from '~/queries';
import { AppBar, AppFooter, Button, RoundCheckbox } from '~/ui';
import { ChevronRightIcon } from '~/ui/icons';

import { useOnboardingContext } from '..';

export function TermsScreen() {
  const { goToPrevious } = useOnboardingContext();
  const termsQuery = useQuery(onboardingTermsQueryOptions.list());

  if (termsQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col">
        <AppBar type="detail" onBack={goToPrevious} />
        <div className="flex flex-1 items-center justify-center">
          <p className="b1-400 text-text-medium">불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (termsQuery.isError) {
    return (
      <main className="flex flex-1 flex-col">
        <AppBar type="detail" onBack={goToPrevious} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <p className="b1-400 text-text-medium text-center">
            약관 정보를 불러오지 못했어요.
            <br />
            잠시 후 다시 시도해주세요.
          </p>
          <Button
            variant="secondary"
            rounded="full"
            size="md"
            onClick={() => termsQuery.refetch()}
          >
            다시 시도
          </Button>
        </div>
      </main>
    );
  }

  return <TermsForm terms={termsQuery.data} onBack={goToPrevious} />;
}

interface TermsFormProps {
  terms: TermItem[];
  onBack: () => void;
}

function TermsForm({ terms, onBack }: TermsFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      agreements: terms.map<TermAgreementInput>((t) => ({
        code: t.code,
        agreed: false,
      })),
    },
    onSubmit: async ({ value }) => {
      const result = await commands.submitOnboardingTermsAgreements(
        value.agreements,
      );
      if (result.status === 'error') throw new Error(result.error);
      if (!result.data) {
        throw new Error('필수 약관 동의가 확인되지 않았습니다.');
      }
      await queryClient.invalidateQueries({
        queryKey: userSettingsQuery.all(),
      });
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

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="flex flex-1 flex-col px-5">
        <h1 className="t2-700 text-text-high">
          이용을 위해 약관 동의가 필요해요
        </h1>
        <p className="b2-400 text-text-medium mt-1.5">
          필수 항목에 동의하면 바로 시작할 수 있어요.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <form.Subscribe selector={(s) => s.values.agreements}>
            {(agreements) => {
              const allChecked = agreements.every((a) => a.agreed);
              const toggleAll = () => {
                const next = !allChecked;
                agreements.forEach((_, i) => {
                  form.setFieldValue(`agreements[${i}].agreed`, next);
                });
              };
              return (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex h-8 cursor-pointer items-center gap-2"
                  aria-pressed={allChecked}
                >
                  <RoundCheckbox checked={allChecked} />
                  <span className="b1-600 text-text-high flex-1 text-left">
                    전체 동의하기
                  </span>
                </button>
              );
            }}
          </form.Subscribe>

          <div className="bg-divider-primary h-px w-full" />

          <ul className="flex flex-col gap-3">
            {terms.map((item, index) => {
              const requiredLabel = item.required ? '(필수)' : '(선택)';

              return (
                <li key={item.code} className="flex h-8 items-center gap-2">
                  <form.Field name={`agreements[${index}].agreed`}>
                    {(field) => (
                      <button
                        type="button"
                        onClick={() => field.handleChange(!field.state.value)}
                        aria-pressed={field.state.value}
                        aria-label={`${item.title} 동의`}
                        className="flex flex-1 cursor-pointer items-center gap-2 text-left"
                      >
                        <RoundCheckbox checked={field.state.value} />
                        <span className="b1-400 text-text-high">
                          {requiredLabel} {item.title}
                        </span>
                      </button>
                    )}
                  </form.Field>
                  <button
                    type="button"
                    onClick={() => handleOpenUrl(item.contentUrl)}
                    aria-label={`${item.title} 자세히 보기`}
                    className="cursor-pointer"
                  >
                    <ChevronRightIcon className="text-text-low size-6" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <form.Subscribe
          selector={(s) => ({
            agreements: s.values.agreements,
            isSubmitting: s.isSubmitting,
            submitError: s.errorMap.onSubmit,
          })}
        >
          {({ agreements, isSubmitting, submitError }) => {
            const requiredAllChecked = terms
              .filter((t) => t.required)
              .every(
                (t) =>
                  agreements.find((a) => a.code === t.code)?.agreed === true,
              );

            return (
              <AppFooter>
                {submitError && (
                  <p className="b2-400 text-error">
                    저장에 실패했습니다. 다시 시도해주세요.
                  </p>
                )}
                <Button
                  rounded="full"
                  size="lg"
                  fullWidth
                  disabled={!requiredAllChecked || isSubmitting}
                  onClick={() => form.handleSubmit()}
                >
                  {isSubmitting ? '저장 중...' : '다음'}
                </Button>
              </AppFooter>
            );
          }}
        </form.Subscribe>
      </div>
    </main>
  );
}
