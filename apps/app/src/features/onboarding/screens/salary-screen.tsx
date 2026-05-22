import { useState } from 'react';

import { MAX_SALARY_AMOUNT } from '~/lib/constants';
import { formatKoreanAmount } from '~/lib/format';
import {
  AmountInput,
  AppBar,
  AppFooter,
  Button,
  Field,
  NumberInput,
  ToggleInput,
} from '~/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/ui/alert-dialog';

import { useOnboardingContext } from '..';
import { SALARY_TYPE_OPTIONS } from '../hooks/use-onboarding-form';

export function SalaryScreen() {
  const { form, goToNext, goToPrevious } = useOnboardingContext();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={() => setConfirmOpen(true)} />

      <div className="flex flex-1 flex-col px-6">
        <h1 className="t2-700 text-text-high">급여 정보를 알려주세요</h1>
        <p className="b2-500 text-text-medium mt-2">
          세전, 세후 상관없이 보고 싶은 금액을 입력해주세요.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          {/* 급여 유형 */}
          <form.Field name="salaryType">
            {(field) => (
              <Field.Root name={field.name}>
                <Field.Label>급여 유형</Field.Label>
                <ToggleInput
                  options={SALARY_TYPE_OPTIONS}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              </Field.Root>
            )}
          </form.Field>

          {/* 급여 금액 */}
          <form.Field
            name="salaryAmount"
            validators={{
              onChange: ({ value }) => {
                if (value < 10_000) return '금액은 1만원 이상 입력해 주세요';
                if (value > MAX_SALARY_AMOUNT)
                  return `최대 ${formatKoreanAmount(MAX_SALARY_AMOUNT)}까지 입력할 수 있습니다`;
                return undefined;
              },
            }}
          >
            {(field) => (
              <form.Subscribe selector={(state) => state.values.salaryType}>
                {(salaryType) => (
                  <Field.Root
                    name={field.name}
                    invalid={field.state.meta.errors.length > 0}
                  >
                    <Field.Label>금액</Field.Label>
                    <AmountInput
                      max={MAX_SALARY_AMOUNT}
                      defaultValue={
                        salaryType === 'monthly' ? 3_000_000 : 36_000_000
                      }
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      error={field.state.meta.errors.filter(Boolean)[0]}
                    />
                  </Field.Root>
                )}
              </form.Subscribe>
            )}
          </form.Field>

          {/* 급여일 */}
          <form.Field
            name="payDay"
            validators={{
              onChange: ({ value }) =>
                value < 1 || value > 31
                  ? '급여일은 1~31 사이여야 합니다'
                  : undefined,
            }}
          >
            {(field) => (
              <Field.Root
                name={field.name}
                invalid={field.state.meta.errors.length > 0}
              >
                <Field.Label>급여일</Field.Label>
                <NumberInput
                  defaultValue={25}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v ?? 0)}
                  suffix="일"
                  formatThousands={false}
                />
                {field.state.meta.errors.filter(Boolean).map((error) => (
                  <Field.Error key={error}>{error}</Field.Error>
                ))}
              </Field.Root>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({
            salaryAmountError: state.fieldMeta.salaryAmount?.errorMap.onChange,
            payDayError: state.fieldMeta.payDay?.errorMap.onChange,
          })}
        >
          {({ salaryAmountError, payDayError }) => (
            <AppFooter>
              <Button
                rounded="full"
                size="lg"
                className="w-full"
                disabled={!!salaryAmountError || !!payDayError}
                onClick={goToNext}
              >
                다음
              </Button>
            </AppFooter>
          )}
        </form.Subscribe>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle>정말 그만 작성하실 건가요?</AlertDialogTitle>
            <AlertDialogDescription>
              뒤로 돌아가기를 누르면
              <br />
              지금까지 작성한 정보가 사라져요
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              아니오
            </AlertDialogCancel>
            <AlertDialogAction onClick={goToPrevious}>네</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
