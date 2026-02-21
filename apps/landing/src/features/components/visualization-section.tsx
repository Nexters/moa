export function VisualizationSection() {
  return (
    <section className="bg-bg-secondary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]">
      <div className="mx-auto flex flex-col items-center gap-10 md:gap-20">
        <div className="text-center">
          <p className="t1-400 text-text-medium">Salary Visualization</p>
          <h2 className="b1-600 md:h2-700 text-text-high mt-2.5">
            <span className="text-green-40">실시간으로 벌고 있는 월급</span>을
            <br />
            <span>바로 확인할 수 있어요</span>
          </h2>
        </div>

        <div className="flex w-full flex-col items-center gap-8 md:flex-row md:justify-center md:gap-10">
          <div className="flex flex-col items-center gap-3 md:gap-6">
            <span className="bg-green-40 t2-700 rounded-full px-6 py-2 text-black">
              Mobile
            </span>
            <img
              src="/moa/images/salary-mobile.avif"
              alt="모바일 앱 실시간 월급 화면"
              className="w-full max-w-[580px]"
            />
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-6">
            <span className="bg-green-40 t2-700 rounded-full px-6 py-2 text-black">
              Desktop
            </span>
            <img
              src="/moa/images/salary-desktop.avif"
              alt="데스크톱 앱 실시간 월급 화면"
              className="w-full max-w-[580px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
