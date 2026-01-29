import {
  AppBar,
  ArrowRightIcon,
  Button,
  DayChipGroup,
  Field,
  TimeInput,
} from '~/ui';

import type { OnboardingScreenProps } from './hooks/use-onboarding-screen';

export function ScheduleScreen({
  form,
  onBack,
  onNext,
}: OnboardingScreenProps) {
  return (
    <main className="flex flex-1 flex-col">
      <AppBar type="detail" onBack={onBack} />

      <div className="flex flex-1 flex-col px-6 pt-4">
        <h1 className="text-t2-700 text-text-high">언제 근무하나요?</h1>

        <div className="mt-8 flex flex-col gap-8">
          {/* 근무 요일 */}
          <form.Field name="workDays">
            {(field) => (
              <Field.Root name={field.name} className="gap-3">
                <Field.Label>근무 요일</Field.Label>
                <DayChipGroup
                  selectedDays={field.state.value}
                  onChange={field.handleChange}
                />
              </Field.Root>
            )}
          </form.Field>

          {/* 근무 시간 */}
          <Field.Root className="gap-3">
            <Field.Label>근무 시간</Field.Label>
            <div className="flex items-center gap-3">
              <form.Field name="workStartTime">
                {(field) => (
                  <TimeInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    className="flex-1"
                  />
                )}
              </form.Field>
              <ArrowRightIcon className="text-text-medium size-4" />
              <form.Field name="workEndTime">
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
              <form.Field name="lunchStartTime">
                {(field) => (
                  <TimeInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    className="flex-1"
                  />
                )}
              </form.Field>
              <ArrowRightIcon className="text-text-medium size-4" />
              <form.Field name="lunchEndTime">
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
            workDays: state.values.workDays,
            workStartTime: state.values.workStartTime,
            workEndTime: state.values.workEndTime,
            lunchStartTime: state.values.lunchStartTime,
            lunchEndTime: state.values.lunchEndTime,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({
            workDays,
            workStartTime,
            workEndTime,
            lunchStartTime,
            lunchEndTime,
            isSubmitting,
          }) => {
            const isValid =
              workDays.length > 0 &&
              workStartTime &&
              workEndTime &&
              lunchStartTime &&
              lunchEndTime;

            const handleSubmit = async () => {
              await form.handleSubmit();
              onNext();
            };

            return (
              <div className="absolute inset-x-0 bottom-9 flex justify-center">
                <Button
                  rounded="full"
                  size="lg"
                  className="w-60"
                  disabled={!isValid || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? '저장 중...' : '다음'}
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </div>
    </main>
  );
}
