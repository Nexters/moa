const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

/** 금액을 원화 형식으로 포맷 (예: 1,234원) */
export function formatCurrency(amount: number): string {
  return `${NUMBER_FORMATTER.format(Math.floor(amount))}원`;
}

/** 금액을 간단한 숫자 형식으로 포맷 (₩ 없이) */
export function formatNumber(amount: number): string {
  return NUMBER_FORMATTER.format(Math.floor(amount));
}
