export function OnboardingSection() {
  return (
    <section className="bg-bg-primary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]">
      <div className="mx-auto flex flex-col items-center gap-10 md:gap-20">
        <div className="text-center">
          <p className="t1-500 text-text-medium">Onboarding</p>
          <h2 className="t2-700 md:h2-700 text-text-high mt-2">
            <span className="text-green-40">근무 시간</span>과{' '}
            <span className="text-green-40">급여</span>만 입력하면
            <br />
            <span>모아를 바로 사용할 수 있어요</span>
          </h2>
        </div>

        <img
          src="/moa/images/onboarding-mockup.avif"
          alt="근무 시간과 급여 입력 화면"
          className="w-full max-w-[1200px]"
        />
      </div>
    </section>
  );
}
