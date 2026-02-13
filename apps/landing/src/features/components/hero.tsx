export function Hero() {
  return (
    <section className="bg-bg-primary px-6 pt-10 pb-20 md:px-[68px] md:pt-[60px] md:pb-[100px] lg:px-[120px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center text-center">
        <img
          src="/moa/images/hero-parachute.avif"
          alt="낙하산 일러스트"
          className="mb-6 h-[200px] w-auto md:mb-10 md:h-[300px] lg:h-[360px]"
        />
        <h1
          className="mb-3 font-bold tracking-[-0.2px] md:mb-4"
          style={titleStyle}
        >
          일하는 동안 실시간으로 쌓이는 <br className="md:hidden" />
          <span className="text-green-40">내 월급</span>
        </h1>
        <p className="b1-400 md:t3-400 text-text-medium mb-8 md:mb-10">
          월급 체감 서비스, MOA
        </p>
        <a
          href="#download"
          className="bg-green-40 text-gray-90 b1-600 md:t3-700 flex h-12 items-center rounded-[32px] px-8 transition-opacity hover:opacity-90 md:h-14 md:px-10"
        >
          다운로드
        </a>
      </div>
    </section>
  );
}

const titleStyle = {
  fontSize: 'clamp(24px, 5vw, 52px)',
  lineHeight: 'clamp(34px, 6.5vw, 68px)',
};
