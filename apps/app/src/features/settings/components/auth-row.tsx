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
  onLogin: (provider: AuthProvider) => void;
  onLogout: () => void;
  isLogoutPending: boolean;
}

export function AuthRow({
  authStatus,
  onLogin,
  onLogout,
  isLogoutPending,
}: Props) {
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2.5">
        <button
          type="button"
          className={infoRowVariants({
            interactive: true,
            className: 'flex flex-1 items-center justify-between',
          })}
          onClick={() => onLogin('kakao')}
        >
          카카오로 로그인
          <ChevronRightIcon className="text-text-low size-6" />
        </button>
        <button
          type="button"
          className={infoRowVariants({
            interactive: true,
            className: 'flex flex-1 items-center justify-between',
          })}
          onClick={() => onLogin('apple')}
        >
          Apple로 로그인
          <ChevronRightIcon className="text-text-low size-6" />
        </button>
      </div>
    </div>
  );
}
