const CARDS = [
  {
    subtitle: '오늘 쌓은 월급',
    amount: '12,000',
    image: '/moa/images/card-graphic-1.avif',
    title: (
      <>
        <span className="text-green-40">오늘</span>은 얼마나 벌었을까?
      </>
    ),
    description:
      '출퇴근 시간과 급여만 입력하면\n오늘 번 월급을 자동으로 계산해드려요.',
  },
  {
    subtitle: '이번달 누적 월급은',
    amount: '1,201,700',
    image: '/moa/images/card-graphic-2.avif',
    title: (
      <>
        <span className="text-green-40">실시간</span>으로 올라가는 숫자
      </>
    ),
    description:
      '근무가 시작되면 금액이 실시간으로 증가하는\n모습을 화면에서 확인할 수 있어요.',
  },
  {
    subtitle: '오늘은 월급날!',
    amount: '3,400,000',
    image: '/moa/images/card-graphic-3.avif',
    title: (
      <>
        당신의 <span className="text-green-40">준비</span>를 함께해요
      </>
    ),
    description: '월급날만 기다리지 말고\n지금 버는 돈을 보면서 같이 준비해요!',
  },
];

export function CardsSection() {
  return (
    <section className="bg-bg-primary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]">
      <div className="mx-auto flex flex-col items-center gap-10 md:gap-[60px]">
        {/* Title */}
        <div className="text-center">
          <h2 className="t2-700 md:h2-700 text-white">
            내가 <span className="text-green-40">일하는 만큼 쌓이는 월급</span>
            으로
          </h2>
          <h2 className="t2-700 md:h2-700 text-white">
            일의 원동력을 찾아드려요
          </h2>
        </div>

        {/* Cards */}
        <div className="flex w-full flex-col gap-[30px] lg:flex-row lg:justify-center">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-container-primary flex flex-col items-center gap-10 rounded-[26px] px-5 py-[50px] lg:w-[380px]"
            >
              {/* Top: subtitle + amount + graphic */}
              <div className="flex h-[250px] flex-col items-center gap-[14px] overflow-clip">
                <div className="flex flex-col items-center px-[13px]">
                  <p className="b2-500 text-text-medium">{card.subtitle}</p>
                  <div className="flex items-center justify-center gap-[3.2px]">
                    <span className="h2-700 text-white">{card.amount}</span>
                    <span className="h3-500 text-text-medium">원</span>
                  </div>
                </div>
                <img
                  src={card.image}
                  alt=""
                  className="h-[160px] w-[160px] object-contain"
                />
              </div>

              {/* Bottom: title + description */}
              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="h3-700 text-white">{card.title}</h3>
                <p className="b1-400 text-text-medium whitespace-pre-line">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
