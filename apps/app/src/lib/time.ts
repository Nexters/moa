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

/** 자정 기준 분을 시간 문자열(HH:MM)로 변환 (24시간 wrap-around) */
export function minutesToTime(minutes: number): string {
  const wrapped = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 야간 근무(overnight shift) 시 end/now 분값을 정규화.
 * end <= start이면 야간 근무로 판단하여 end에 24*60을 더하고,
 * now가 start보다 작으면 now에도 24*60을 더한다.
 */
export function normalizeOvernightMinutes(
  startMinutes: number,
  endMinutes: number,
  nowMinutes: number,
): { normalizedEnd: number; normalizedNow: number } {
  const isOvernight = endMinutes <= startMinutes;
  const normalizedEnd = isOvernight ? endMinutes + 24 * 60 : endMinutes;
  const normalizedNow =
    isOvernight && nowMinutes < startMinutes
      ? nowMinutes + 24 * 60
      : nowMinutes;
  return { normalizedEnd, normalizedNow };
}

/** 현재 시각을 HH:MM 형식 문자열로 반환 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
