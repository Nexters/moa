const CARDS = [
  {
    subtitle: '오늘 쌓은 금액',
    amount: '12,000원',
    image: '/moa/images/card-graphic-1.png',
    title: '오늘은 얼마나 벌었을까?',
    description: '하루 동안 일한 만큼 실시간으로 쌓이는 금액을 확인해 보세요.',
  },
  {
    subtitle: '이번달까지 누적 월급은',
    amount: '1,201,700원',
    image: '/moa/images/card-graphic-2.png',
    title: '실시간으로 올라가는 숫자',
    description: '월급날까지 얼마나 모았는지, 실시간으로 확인할 수 있어요.',
  },
  {
    subtitle: '내년의 총급여',
    amount: '3,400,000원',
    image: '/moa/images/card-graphic-3.png',
    title: '당신의 준비를 함께해요',
    description:
      '연봉 기반으로 예상되는 총급여를 미리 확인하고 계획을 세워보세요.',
  },
] as const;

export function CardsSection() {
  return (
    <section className="bg-bg-primary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="t2-700 md:h2-700 mb-2 text-center text-white md:mb-3">
          내가 일하는 만큼 쌓이는 월급으로
        </h2>
        <p className="b1-400 md:t3-400 text-text-medium mb-10 text-center md:mb-16">
          <span className="text-green-40">모아</span>가 보여드릴게요
        </p>

        <div className="flex flex-col gap-[30px] lg:flex-row">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-container-primary flex flex-1 flex-col items-center rounded-[26px] px-5 py-[50px]"
            >
              <p className="c1-500 text-text-medium mb-1">{card.subtitle}</p>
              <p className="t1-700 md:h3-700 mb-6 text-white">{card.amount}</p>
              <img
                src={card.image}
                alt={card.title}
                className="mb-6 h-[160px] w-auto object-contain md:h-[200px]"
              />
              <h3 className="b1-600 md:t3-700 text-green-40 mb-2">
                {card.title}
              </h3>
              <p className="b2-400 md:b1-400 text-text-medium text-center">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
