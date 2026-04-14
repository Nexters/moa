import { Link } from '@tanstack/react-router';

import type { AuthStatus } from '~/lib/tauri-bindings';
import { ChevronRightIcon, EditIcon } from '~/ui/icons';

interface Props {
  authStatus: AuthStatus | undefined;
  nickname: string | null | undefined;
}

export function AuthRow({ authStatus, nickname }: Props) {
  if (authStatus?.isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <span className="t1-700 text-green-40">{nickname ?? '\u00A0'}</span>
        <EditIcon className="text-text-low size-5" />
      </div>
    );
  }

  return (
    <Link
      to="/login"
      search={{ returnTo: '/settings' }}
      className="flex w-full items-center gap-1"
    >
      <span className="t1-700 text-green-40">로그인 · 회원가입하기</span>
      <ChevronRightIcon className="text-text-high size-6" />
    </Link>
  );
}
