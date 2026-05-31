import { useNavigate } from '@tanstack/react-router';

import { AppBar, Button, Checkbox } from '~/ui';

import {
  WITHDRAWAL_REASON_OPTIONS,
  useWithdrawalForm,
} from '../hooks/use-withdrawal-form';

export function WithdrawalScreen() {
  const navigate = useNavigate();
  const form = useWithdrawalForm();

  return (
    <main className="bg-bg-primary relative flex h-full flex-col">
      <AppBar
        type="detail"
        title="회원 탈퇴"
        onBack={() => navigate({ to: '/settings' })}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="scrollbar-overlay flex min-h-0 flex-1 flex-col"
      >
        <div className="px-5 pb-32">
          <header className="mb-7 flex flex-col gap-1.5">
            <p className="b2-400 text-text-medium">헤어지게 되어 아쉬워요..</p>
            <h1 className="t2-700 text-text-high">
              탈퇴 사유를 알려주시면 더 나은 서비스를
              <br />
              제공하기 위해 노력할게요.
            </h1>
          </header>

          <div className="flex flex-col gap-6">
            <form.Field name="reasons">
              {(field) =>
                WITHDRAWAL_REASON_OPTIONS.map((label) => {
                  const checked = field.state.value.includes(label);
                  return (
                    <Checkbox
                      key={label}
                      label={label}
                      checked={checked}
                      onChange={(next) =>
                        field.handleChange(
                          next
                            ? [...field.state.value, label]
                            : field.state.value.filter((r) => r !== label),
                        )
                      }
                    />
                  );
                })
              }
            </form.Field>
          </div>
        </div>

        <div className="from-bg-primary/0 to-bg-primary pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-b px-8 pt-10 pb-8">
          <form.Subscribe
            selector={(state) => ({
              count: state.values.reasons.length,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ count, isSubmitting }) => {
              const disabled = count === 0 || isSubmitting;
              return (
                <Button
                  type="submit"
                  rounded="full"
                  size="lg"
                  className="pointer-events-auto w-full"
                  disabled={disabled}
                >
                  {isSubmitting ? '탈퇴 중...' : '탈퇴하기'}
                </Button>
              );
            }}
          </form.Subscribe>
        </div>
      </form>
    </main>
  );
}
