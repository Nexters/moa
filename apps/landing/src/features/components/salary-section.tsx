export function SalarySection() {
  return (
    <section className="bg-bg-secondary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center">
        <h2 className="t2-700 md:h2-700 mb-2 text-center text-white md:mb-3">
          지금 이 시간,
        </h2>
        <h2 className="t2-700 md:h2-700 mb-8 text-center text-white md:mb-12">
          나 얼마 벌고 있을까?
        </h2>

        {/* Popover Card */}
        <div className="w-full max-w-[504px] rounded-[20px] bg-white/[0.08] p-6 shadow-[2px_4px_20px_0px_rgba(0,0,0,0.25)] md:p-8">
          {/* Tooltip pill */}
          <div className="mb-4 flex items-center gap-2">
            <span className="bg-gray-70 c1-500 rounded-full px-3 py-1 text-white">
              실시간
            </span>
          </div>

          {/* Money icon + salary */}
          <div className="mb-4 flex items-center gap-3 md:mb-6">
            <img
              src="/moa/images/moa-money.png"
              alt="돈 아이콘"
              className="h-10 w-10 md:h-14 md:w-14"
            />
            <div>
              <p className="c1-400 text-text-medium mb-1">오늘 쌓은 월급</p>
              <p
                className="font-bold tracking-[-0.2px] text-white"
                style={salaryStyle}
              >
                2,150,000
                <span className="t2-700 md:h3-700">원</span>
              </p>
            </div>
          </div>

          {/* Status info */}
          <div className="bg-gray-70 flex items-center justify-between rounded-[12px] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="bg-green-40 h-2 w-2 rounded-full" />
              <span className="b2-500 text-text-medium">근무 중</span>
            </div>
            <span className="b2-400 text-text-low">6시간 32분</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const salaryStyle = {
  fontSize: 'clamp(28px, 5vw, 56px)',
  lineHeight: 'clamp(38px, 6.5vw, 72px)',
};
