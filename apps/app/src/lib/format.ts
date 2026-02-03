const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

/** 금액을 원화 형식으로 포맷 (예: 1,234원) */
export function formatCurrency(amount: number): string {
  return `${NUMBER_FORMATTER.format(Math.floor(amount))}원`;
}

export function formatMonth(date = new Date()): string {
  const month = date.getMonth() + 1;
  return `${month}월`;
}
