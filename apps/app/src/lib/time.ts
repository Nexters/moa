/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 시간 문자열(HH:MM)을 자정 기준 분으로 변환 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 현재 시각이 주어진 시간 범위(HH:MM) 안에 있는지 판별 */
export function isWithinTimeRange(
  now: Date,
  startTime: string,
  endTime: string,
): boolean {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (
    nowMinutes >= timeToMinutes(startTime) &&
    nowMinutes <= timeToMinutes(endTime)
  );
}
