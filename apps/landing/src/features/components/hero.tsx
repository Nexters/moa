export function Hero() {
  return (
    <section className="bg-bg-primary px-6 pt-10 pb-20 md:px-[68px] md:pt-[60px] md:pb-[100px] lg:px-[120px] lg:pt-[100px] lg:pb-[160px]">
      <div className="mx-auto flex flex-col items-center gap-6 text-center md:gap-10">
        <img
          src="/moa/images/hero-parachute.avif"
          alt="낙하산 일러스트"
          className="h-[120px] w-[120px] object-contain md:h-[150px] md:w-[150px] lg:h-[180px] lg:w-[180px]"
        />
        <div className="flex flex-col gap-4">
          <div style={titleStyle}>
            <p className="text-white">일하는 동안 실시간으로 쌓이는 내 월급</p>
            <p className="text-green-40">월급 체감 서비스, MOA</p>
          </div>
          <p className="t3-400 text-text-medium">
            고르기 힘들까 봐 모바일, 데스크톱 앱 둘다 준비했어요!
          </p>
        </div>
        <a
          href="#download"
          className="bg-green-40 text-gray-90 b1-600 flex w-[130px] items-center justify-center rounded-[32px] px-5 py-4 transition-opacity hover:opacity-90"
        >
          앱 다운로드
        </a>
      </div>
    </section>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(24px, 5vw, 52px)',
  lineHeight: '1.3',
  fontWeight: 700,
  letterSpacing: '-0.2px',
};
