import {
  AppBar,
  AppFooter,
  ArrowRightIcon,
  Button,
  DayChipGroup,
  Field,
  TimeInput,
} from '~/ui';

import type { OnboardingScreenProps } from '../hooks/use-onboarding-screen';

export function ScheduleScreen({ form, onBack }: OnboardingScreenProps) {
  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="flex flex-1 flex-col px-6 pt-4">
        <h1 className="t2-700 text-text-high">언제 근무하나요?</h1>

        <div className="mt-8 flex flex-col gap-8">
          {/* 근무 요일 */}
          <form.Field
            name="workDays"
            validators={{
              onChange: ({ value }) =>
                value.length === 0 ? '근무 요일을 선택해주세요' : undefined,
            }}
          >
            {(field) => (
              <Field.Root
                name={field.name}
                className="gap-3"
                invalid={field.state.meta.errors.length > 0}
              >
                <Field.Label>근무 요일</Field.Label>
                <DayChipGroup
                  selectedDays={field.state.value}
                  onChange={field.handleChange}
                />
                {field.state.meta.errors.filter(Boolean).map((error) => (
                  <Field.Error key={error}>{error}</Field.Error>
                ))}
              </Field.Root>
            )}
          </form.Field>

          {/* 근무 시간 */}
          <Field.Root className="gap-3">
            <Field.Label>근무 시간</Field.Label>
            <div className="flex items-center gap-3">
              <form.Field
                name="workStartTime"
                validators={{
                  onChange: ({ value }) =>
                    !value ? '출근 시간을 입력해주세요' : undefined,
                }}
              >
                {(field) => (
                  <TimeInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    className="flex-1"
                  />
                )}
              </form.Field>
              <ArrowRightIcon className="text-text-medium size-4" />
              <form.Field
                name="workEndTime"
                validators={{
                  onChange: ({ value }) =>
                    !value ? '퇴근 시간을 입력해주세요' : undefined,
                }}
              >
                {(field) => (
                  <TimeInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    className="flex-1"
                  />
                )}
              </form.Field>
            </div>
          </Field.Root>

          {/* 점심 시간 */}
          <Field.Root className="gap-3">
            <Field.Label>점심 시간</Field.Label>
            <div className="flex items-center gap-3">
              <form.Field
                name="lunchStartTime"
                validators={{
                  onChange: ({ value }) =>
                    !value ? '점심 시작 시간을 입력해주세요' : undefined,
                }}
              >
                {(field) => (
                  <TimeInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    className="flex-1"
                  />
                )}
              </form.Field>
              <ArrowRightIcon className="text-text-medium size-4" />
              <form.Field
                name="lunchEndTime"
                validators={{
                  onChange: ({ value }) =>
                    !value ? '점심 종료 시간을 입력해주세요' : undefined,
                }}
              >
                {(field) => (
                  <TimeInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    className="flex-1"
                  />
                )}
              </form.Field>
            </div>
          </Field.Root>
        </div>

        <form.Subscribe
          selector={(state) => ({
            workDaysError: state.fieldMeta.workDays?.errorMap.onChange,
            workStartTimeError:
              state.fieldMeta.workStartTime?.errorMap.onChange,
            workEndTimeError: state.fieldMeta.workEndTime?.errorMap.onChange,
            lunchStartTimeError:
              state.fieldMeta.lunchStartTime?.errorMap.onChange,
            lunchEndTimeError: state.fieldMeta.lunchEndTime?.errorMap.onChange,
            isSubmitting: state.isSubmitting,
            submitError: state.errorMap.onSubmit,
          })}
        >
          {({
            workDaysError,
            workStartTimeError,
            workEndTimeError,
            lunchStartTimeError,
            lunchEndTimeError,
            isSubmitting,
            submitError,
          }) => {
            const hasErrors =
              !!workDaysError ||
              !!workStartTimeError ||
              !!workEndTimeError ||
              !!lunchStartTimeError ||
              !!lunchEndTimeError;

            return (
              <AppFooter>
                <div className="flex flex-col items-center gap-2">
                  {submitError && (
                    <p className="b2-400 text-error">
                      저장에 실패했습니다. 다시 시도해주세요.
                    </p>
                  )}
                  <Button
                    rounded="full"
                    size="lg"
                    className="w-60"
                    disabled={hasErrors || isSubmitting}
                    onClick={() => form.handleSubmit()}
                  >
                    {isSubmitting ? '저장 중...' : '다음'}
                  </Button>
                </div>
              </AppFooter>
            );
          }}
        </form.Subscribe>
      </div>
    </main>
  );
}
