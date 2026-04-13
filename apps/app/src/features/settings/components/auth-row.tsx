import { Link } from '@tanstack/react-router';

import type { AuthProvider, AuthStatus } from '~/lib/tauri-bindings';
import { Button } from '~/ui';
import { ChevronRightIcon } from '~/ui/icons';
import { infoRowVariants } from '~/ui/info-row';

const PROVIDER_LABELS: Record<AuthProvider, string> = {
  kakao: '카카오',
  apple: 'Apple',
};

interface Props {
  authStatus: AuthStatus | undefined;
  onLogout: () => void;
  isLogoutPending: boolean;
}

export function AuthRow({ authStatus, onLogout, isLogoutPending }: Props) {
  if (authStatus?.isLoggedIn) {
    const label = authStatus.provider
      ? `${PROVIDER_LABELS[authStatus.provider]} 연동됨`
      : '연동됨';

    return (
      <div className={infoRowVariants()}>
        <span className="text-text-high">{label}</span>
        <Button
          variant="link"
          size="flat"
          disabled={isLogoutPending}
          onClick={onLogout}
        >
          로그아웃
        </Button>
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
