const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

/** 금액을 원화 형식으로 포맷 (예: 1,234원) */
export function formatCurrency(amount: number): string {
  return `${NUMBER_FORMATTER.format(Math.floor(amount))}원`;
}

/** 금액을 억/만/원 단위 한글 표기로 포맷 (예: 580,000,000 → "5억 8000만원", 8,888,888,888 → "88억 8888.9만원") */
export function formatKoreanAmount(amount: number): string {
  if (amount < 10_000) return formatCurrency(amount);

  const rounded = Math.round(amount / 1_000) * 1_000;
  const eok = Math.floor(rounded / 100_000_000);
  const thousandsInMan = (rounded % 100_000_000) / 1_000;
  const manInt = Math.floor(thousandsInMan / 10);
  const manDec = thousandsInMan % 10;
  const manStr = manDec === 0 ? `${manInt}` : `${manInt}.${manDec}`;
  const hasMan = thousandsInMan > 0;

  if (eok > 0 && hasMan) return `${eok}억 ${manStr}만원`;
  if (eok > 0) return `${eok}억원`;
  if (hasMan) return `${manStr}만원`;
  return formatCurrency(amount);
}

export function formatMonth(date = new Date()): string {
  const month = date.getMonth() + 1;
  return `${month}월`;
}
