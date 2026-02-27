export function useIsPayday(payDay: number): boolean {
  const today = new Date();
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const effectivePayDay = Math.min(payDay, lastDay);
  return today.getDate() === effectivePayDay;
}
