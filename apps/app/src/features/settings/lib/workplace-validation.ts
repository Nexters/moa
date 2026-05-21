export type WorkplaceError = 'empty' | 'invalidChar';

export const WORKPLACE_MAX_LENGTH = 20;

const ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]*$/;

export function validateWorkplace(value: string): WorkplaceError | null {
  if (value.length === 0) return 'empty';
  if (!ALLOWED.test(value)) return 'invalidChar';
  return null;
}
