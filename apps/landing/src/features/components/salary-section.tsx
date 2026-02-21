import NumberFlow, { continuous } from '@number-flow/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// 가정: 월급 400만, 월급일 25일, 오늘 12일, 근무 09:00-18:00, 주5일
// salary.rs calculate_salary 로직 기반
const MONTHLY_SALARY = 4_500_000;
const WORK_DAYS_IN_PERIOD = 21; // 전월 25일~당월 25일 근무일
const WORKED_DAYS = 12; // 전월 25일~오늘 전까지 근무일
const WORK_HOURS = 9;
const DAILY_RATE = MONTHLY_SALARY / WORK_DAYS_IN_PERIOD;
const PER_SECOND = DAILY_RATE / WORK_HOURS / 3600;
const INITIAL_WORKED_SECONDS = 3 * 3600; // 12:00 기준 (3시간 근무)
const INITIAL_TODAY = Math.round(PER_SECOND * INITIAL_WORKED_SECONDS);
const INITIAL_ACCUMULATED = Math.round(
  WORKED_DAYS * DAILY_RATE + INITIAL_TODAY,
);
const LOOP_SEC = 30;

export function SalarySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [accumulated, setAccumulated] = useState(INITIAL_ACCUMULATED);
  const [todayEarnings, setTodayEarnings] = useState(INITIAL_TODAY);

  const startCounting = useCallback(() => {
    let tick = 0;

    const id = setInterval(() => {
      tick++;
      if (tick >= LOOP_SEC) {
        tick = 0;
        setAccumulated(INITIAL_ACCUMULATED);
        setTodayEarnings(INITIAL_TODAY);
      } else {
        const delta = Math.round(PER_SECOND * tick);
        setAccumulated(INITIAL_ACCUMULATED + delta);
        setTodayEarnings(INITIAL_TODAY + delta);
      }
    }, 1000);

    return id;
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          intervalId = startCounting();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (intervalId) clearInterval(intervalId);
    };
  }, [startCounting]);

  return (
    <section
      ref={sectionRef}
      className="bg-bg-secondary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]"
    >
      <div className="mx-auto flex flex-col items-center gap-10 md:gap-[60px]">
        {/* Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="t2-700 md:h2-700 text-text-high">
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
              <span className="t2-500 text-text-high">
                이번달에 쌓은 월급{' '}
                <NumberFlow
                  value={accumulated}
                  locales="ko-KR"
                  format={{ maximumFractionDigits: 0 }}
                  plugins={[continuous]}
                  className="t2-500 tabular-nums"
                />
                원
              </span>
            </div>
            <div className="border-t-gray-70 h-0 w-0 border-x-12 border-t-13 border-x-transparent" />
          </div>

          {/* Content card */}
          <div className="flex w-full flex-col gap-6 pt-4 md:w-[504px]">
            {/* Icon + label + salary */}
            <div className="flex flex-col items-center gap-4 px-5 md:px-7">
              <img
                src="/moa/images/coin-rotate.gif"
                alt=""
                className="size-[80px] md:size-[112px]"
              />
              <div className="flex flex-col items-center gap-[5.6px]">
                <p className="t1-500 text-text-high">오늘 쌓은 월급</p>
                <div className="flex items-end justify-center gap-[5.6px]">
                  <NumberFlow
                    value={todayEarnings}
                    locales="ko-KR"
                    format={{ maximumFractionDigits: 0 }}
                    plugins={[continuous]}
                    className="text-text-high font-bold tracking-[-0.28px] tabular-nums"
                    style={salaryStyle}
                  />
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
                <span className="t2-700 text-text-high">09:00 - 18:00</span>
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
