const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

/** 금액을 원화 형식으로 포맷 (예: 1,234원) */
export function formatCurrency(amount: number): string {
  return `${NUMBER_FORMATTER.format(Math.floor(amount))}원`;
}

/** 금액을 억/만/원 단위 한글 표기로 포맷 (예: 580,000,000 → "5억 8000만원") */
export function formatKoreanAmount(amount: number): string {
  const eok = Math.floor(amount / 100_000_000);
  const man = Math.floor((amount % 100_000_000) / 10_000);

  if (amount % 10_000 !== 0) return formatCurrency(amount);
  if (eok > 0 && man > 0) return `${eok}억 ${man}만원`;
  if (eok > 0) return `${eok}억원`;
  if (man > 0) return `${man}만원`;
  return formatCurrency(amount);
}

export function formatMonth(date = new Date()): string {
  const month = date.getMonth() + 1;
  return `${month}월`;
}
