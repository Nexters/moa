import { openUrl } from '@tauri-apps/plugin-opener';
import { cn } from 'tailwind-variants';

import { IconButton } from './icon-button';
import {
  ArrowLeftIcon,
  CelebrationIcon,
  MoaLogoIcon,
  SettingsIcon,
} from './icons';

type AppBarType = 'main' | 'detail';

interface AppBarProps {
  type?: AppBarType;
  title?: string;
  onBack?: () => void;
  onSettings?: () => void;
  onCelebrate?: () => void;
  isPayday?: boolean;
  className?: string;
}

export function AppBar({
  type = 'main',
  title,
  onBack,
  onSettings,
  onCelebrate,
  isPayday,
  className,
}: AppBarProps) {
  return (
    <header
      className={cn(
        'bg-bg-primary flex h-16 items-center gap-1 px-1',
        className,
      )}
    >
      {type === 'main' ? (
        <MainAppBar
          onSettings={onSettings}
          onCelebrate={onCelebrate}
          isPayday={isPayday}
        />
      ) : (
        <DetailAppBar title={title} onBack={onBack} />
      )}
    </header>
  );
}

interface MainAppBarProps {
  onSettings?: () => void;
  onCelebrate?: () => void;
  isPayday?: boolean;
}

function MainAppBar({ onSettings, onCelebrate, isPayday }: MainAppBarProps) {
  return (
    <>
      <button
        className="text-text-high cursor-pointer px-5 py-2.5"
        aria-label="Moa 홈페이지"
        onClick={() => openUrl('https://nexters.github.io/moa')}
      >
        <MoaLogoIcon aria-hidden="true" />
      </button>
      <div className="flex-1" />
      {isPayday && onCelebrate && (
        <IconButton
          data-attr="월급날_축하_클릭"
          onClick={onCelebrate}
          aria-label="월급날 축하"
        >
          <CelebrationIcon />
        </IconButton>
      )}
      {onSettings && (
        <IconButton
          data-attr="설정_아이콘_클릭"
          onClick={onSettings}
          aria-label="설정"
        >
          <SettingsIcon />
        </IconButton>
      )}
    </>
  );
}

interface DetailAppBarProps {
  title?: string;
  onBack?: () => void;
}

function DetailAppBar({ title, onBack }: DetailAppBarProps) {
  return (
    <>
      <IconButton size="sm" onClick={onBack} aria-label="뒤로가기">
        <ArrowLeftIcon />
      </IconButton>
      {title && (
        <>
          <div className="flex-1" />
          <h1 className="t3-500 text-text-high">{title}</h1>
          <div className="flex-1" />
          <div className="size-10" />
        </>
      )}
    </>
  );
}
