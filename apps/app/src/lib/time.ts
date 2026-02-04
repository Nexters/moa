/** 시간 문자열(HH:MM)을 자정 기준 분으로 변환 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 자정 기준 분을 시간 문자열(HH:MM)로 변환 (00:00 ~ 23:59 범위로 클램핑) */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 현재 시각을 HH:MM 형식 문자열로 반환 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
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
