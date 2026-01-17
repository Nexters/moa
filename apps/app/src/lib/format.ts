/** 금액을 원화 형식으로 포맷 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(Math.floor(amount));
}

/** 금액을 간단한 숫자 형식으로 포맷 (₩ 없이) */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 0,
  }).format(Math.floor(amount));
}
