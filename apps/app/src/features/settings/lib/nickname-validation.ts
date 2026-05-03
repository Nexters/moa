export type NicknameError = 'empty' | 'tooLong' | 'invalidChar';

const MAX_LENGTH = 10;
const ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/;

export function validateNickname(value: string): NicknameError | null {
  if (value.length === 0) return 'empty';
  if (value.length > MAX_LENGTH) return 'tooLong';
  if (!ALLOWED.test(value)) return 'invalidChar';
  return null;
}
