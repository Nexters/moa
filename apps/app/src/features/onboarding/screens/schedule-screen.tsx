import { AppBar, AppFooter, Button, DayChipGroup, Field } from '~/ui';
import { TimePeriodInput } from '~/ui/time-period-input';

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
            <form.Subscribe
              selector={(s) => ({
                startTime: s.values.workStartTime,
                endTime: s.values.workEndTime,
              })}
            >
              {(value) => (
                <TimePeriodInput
                  value={value}
                  onChange={(v) => {
                    form.setFieldValue('workStartTime', v.startTime);
                    form.setFieldValue('workEndTime', v.endTime);
                  }}
                />
              )}
            </form.Subscribe>
          </Field.Root>

          {/* 점심 시간 */}
          <Field.Root className="gap-3">
            <Field.Label>점심 시간</Field.Label>
            <form.Subscribe
              selector={(s) => ({
                startTime: s.values.lunchStartTime,
                endTime: s.values.lunchEndTime,
              })}
            >
              {(value) => (
                <TimePeriodInput
                  value={value}
                  onChange={(v) => {
                    form.setFieldValue('lunchStartTime', v.startTime);
                    form.setFieldValue('lunchEndTime', v.endTime);
                  }}
                />
              )}
            </form.Subscribe>
          </Field.Root>
        </div>

        <form.Subscribe
          selector={(state) => ({
            workDaysError: state.fieldMeta.workDays?.errorMap.onChange,
            isSubmitting: state.isSubmitting,
            submitError: state.errorMap.onSubmit,
          })}
        >
          {({ workDaysError, isSubmitting, submitError }) => {
            const hasErrors = !!workDaysError;

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
