import { Link, useNavigate } from '@tanstack/react-router';

import type { AuthStatus } from '~/lib/tauri-bindings';
import { IconButton } from '~/ui';
import { ChevronRightIcon, EditIcon } from '~/ui/icons';

interface Props {
  authStatus: AuthStatus | undefined;
  nickname: string | null | undefined;
}

export function AuthRow({ authStatus, nickname }: Props) {
  const navigate = useNavigate();

  if (authStatus?.isLoggedIn) {
    const goToEdit = () => navigate({ to: '/settings/edit-nickname' });
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goToEdit}
          className="t1-700 text-green-40 cursor-pointer"
        >
          {nickname ?? ' '}
        </button>
        <IconButton size="sm" onClick={goToEdit} aria-label="닉네임 수정">
          <EditIcon className="size-5" />
        </IconButton>
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
