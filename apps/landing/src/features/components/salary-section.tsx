export function SalarySection() {
  return (
    <section className="bg-bg-secondary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]">
      <div className="mx-auto flex flex-col items-center gap-10 md:gap-[60px]">
        {/* Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="t2-700 md:h2-700 text-white">
            지금 이 시간, 나 얼마 벌고 있을까?
          </h2>
          <p className="t3-400 text-text-medium">
            출근부터 퇴근까지, 내 업무의 보상을 숫자로 바로 느껴보세요.
          </p>
        </div>

        {/* Popover */}
        <div className="flex w-full flex-col items-center">
          {/* Tooltip pill + arrow */}
          <div className="z-10 flex flex-col items-center">
            <div className="bg-gray-70 flex items-center rounded-full px-5 py-[11px]">
              <span className="t2-500 text-white">
                이번달에 쌓은 월급 123,203,000원
              </span>
            </div>
            <div className="border-t-gray-70 h-0 w-0 border-x-12 border-t-13 border-x-transparent" />
          </div>

          {/* Content card */}
          <div className="flex w-full flex-col gap-6 pt-4 md:w-[504px]">
            {/* Icon + label + salary */}
            <div className="flex flex-col items-center gap-4 px-5 md:px-7">
              <img
                src="/moa/images/moa-money.avif"
                alt="MOA 아이콘"
                className="h-[80px] w-[80px] object-contain md:h-[112px] md:w-[112px]"
              />
              <div className="flex flex-col items-center gap-[5.6px]">
                <p className="t1-500 text-white">오늘 쌓은 월급</p>
                <div className="flex items-end justify-center gap-[5.6px]">
                  <span
                    className="font-bold tracking-[-0.28px] text-white"
                    style={salaryStyle}
                  >
                    2,150,000
                  </span>
                  <span
                    className="text-text-medium font-normal tracking-[-0.2px]"
                    style={wonStyle}
                  >
                    원
                  </span>
                </div>
              </div>
            </div>

            {/* Status card */}
            <div className="bg-gray-70 flex flex-col gap-5 rounded-[22px] p-[22px] shadow-[2px_4px_20px_0px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <span className="t2-500 text-text-medium">근무 상태</span>
                <span className="t2-700 text-green-40">근무 중</span>
              </div>
              <div className="bg-gray-60 h-px w-full" />
              <div className="flex items-center justify-between">
                <span className="t2-500 text-text-medium">근무 시간</span>
                <span className="t2-700 text-white">09:00 - 18:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const salaryStyle: React.CSSProperties = {
  fontSize: 'clamp(28px, 5vw, 56px)',
  lineHeight: '70px',
};

const wonStyle: React.CSSProperties = {
  fontSize: 'clamp(24px, 4vw, 40px)',
  lineHeight: '50px',
};
