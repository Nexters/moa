import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import {
  type WorkplaceError,
  validateWorkplace,
  WORKPLACE_MAX_LENGTH,
} from '~/features/settings/lib/workplace-validation';
import { useProfileWorkplace, useUpdateWorkplace } from '~/hooks/use-auth';
import { AppBar, AppFooter, Button } from '~/ui';

export function EditWorkplaceScreen() {
  const navigate = useNavigate();
  const { data: workplace } = useProfileWorkplace();
  const goBack = () => navigate({ to: '/settings/salary-info' });

  return (
    <main className="bg-bg-primary relative flex h-full flex-col">
      <AppBar type="detail" title="회사명" onBack={goBack} />
      <EditWorkplaceForm initialWorkplace={workplace ?? ''} onDone={goBack} />
    </main>
  );
}

interface EditWorkplaceFormProps {
  initialWorkplace: string;
  onDone: () => void;
}

function EditWorkplaceForm({
  initialWorkplace,
  onDone,
}: EditWorkplaceFormProps) {
  const updateMutation = useUpdateWorkplace();

  const form = useForm({
    defaultValues: { workplace: initialWorkplace },
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync(value.workplace);
        onDone();
      } catch (err) {
        if (err instanceof Error) toast.error(err.message);
      }
    },
  });

  return (
    <>
      <div className="mt-14 flex flex-col items-center gap-2 px-5">
        <p className="t1-700 text-text-high text-center">저는</p>
        <form.Field
          name="workplace"
          validators={{
            onChange: ({ value }) => validateWorkplace(value) ?? undefined,
          }}
        >
          {(field) => (
            <div className="bg-container-primary flex w-full items-center justify-center rounded-xl p-4">
              <input
                type="text"
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value.slice(0, WORKPLACE_MAX_LENGTH),
                  )
                }
                maxLength={WORKPLACE_MAX_LENGTH}
                placeholder="회사명을 입력해주세요"
                className="t1-700 text-green-40 placeholder:text-text-disabled w-full bg-transparent text-center focus:outline-none"
                autoFocus
              />
            </div>
          )}
        </form.Field>
        <p className="t1-700 text-text-high text-center">에서 일해요</p>
      </div>

      <form.Subscribe
        selector={(state) => ({
          value: state.values.workplace,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ value, isSubmitting }) => {
          const error = validateWorkplace(value);
          const helperMessage = getHelperMessage(error);
          const canSubmit = error === null && !isSubmitting;
          return (
            <AppFooter>
              {helperMessage && (
                <p className="b2-500 text-text-low text-center">
                  {helperMessage}
                </p>
              )}
              <Button
                variant="primary"
                rounded="full"
                size="lg"
                fullWidth
                disabled={!canSubmit}
                onClick={() => form.handleSubmit()}
              >
                {isSubmitting ? '저장 중...' : '완료'}
              </Button>
            </AppFooter>
          );
        }}
      </form.Subscribe>
    </>
  );
}

function getHelperMessage(error: WorkplaceError | null): string | null {
  switch (error) {
    case 'empty':
      return '20자까지 입력할 수 있어요';
    case 'invalidChar':
      return '한글, 영문, 숫자만 입력할 수 있어요';
    default:
      return null;
  }
}
