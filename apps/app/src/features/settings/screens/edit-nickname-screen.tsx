import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { generateRandomNickname } from '~/features/settings/lib/nickname-pool';
import {
  type NicknameError,
  validateNickname,
} from '~/features/settings/lib/nickname-validation';
import { useProfileNickname, useUpdateNickname } from '~/hooks/use-auth';
import { AppBar, AppFooter, Button } from '~/ui';
import { RestartIcon } from '~/ui/icons';

export function EditNicknameScreen() {
  const navigate = useNavigate();
  const { data: nickname } = useProfileNickname();
  const goBack = () => navigate({ to: '/settings' });

  return (
    <main className="bg-bg-primary relative flex h-full flex-col">
      <AppBar type="detail" title="닉네임" onBack={goBack} />
      <EditNicknameForm initialNickname={nickname ?? ''} onDone={goBack} />
    </main>
  );
}

interface EditNicknameFormProps {
  initialNickname: string;
  onDone: () => void;
}

function EditNicknameForm({ initialNickname, onDone }: EditNicknameFormProps) {
  const updateMutation = useUpdateNickname();

  const form = useForm({
    defaultValues: { nickname: initialNickname },
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync(value.nickname);
        onDone();
      } catch (err) {
        if (err instanceof Error) toast.error(err.message);
      }
    },
  });

  return (
    <>
      <div className="mt-14 flex flex-col items-center gap-8 px-5">
        <form.Field
          name="nickname"
          validators={{
            onChange: ({ value }) => validateNickname(value) ?? undefined,
          }}
        >
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <p className="t1-700 text-text-high text-center">닉네임</p>
              <div className="bg-container-primary flex items-center justify-center rounded-xl p-4">
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="닉네임을 입력해주세요"
                  className="t1-700 text-green-40 placeholder:text-text-disabled w-full bg-transparent text-center focus:outline-none"
                  autoFocus
                />
              </div>
              <p className="t1-700 text-text-high text-center">로 수정할게요</p>
            </div>
          )}
        </form.Field>

        <button
          type="button"
          onClick={() =>
            form.setFieldValue(
              'nickname',
              generateRandomNickname(form.getFieldValue('nickname')),
            )
          }
          className="bg-container-primary hover:bg-interactive-hover flex cursor-pointer items-center gap-1 rounded-sm px-3 py-2 transition-colors"
        >
          <RestartIcon className="text-text-high size-4" />
          <span className="b2-500 text-text-high">랜덤변경</span>
        </button>
      </div>

      <form.Subscribe
        selector={(state) => ({
          value: state.values.nickname,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ value, isSubmitting }) => {
          const error = validateNickname(value);
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

function getHelperMessage(error: NicknameError | null): string | null {
  switch (error) {
    case 'tooLong':
      return '10자까지 입력할 수 있어요';
    case 'invalidChar':
      return '한글, 영문, 숫자만 입력할 수 있어요';
    default:
      return null;
  }
}
