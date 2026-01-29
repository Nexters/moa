import { cn } from 'tailwind-variants';

import { IconButton } from './icon-button';
import { ArrowLeftIcon, SettingsIcon } from './icons';

type AppBarType = 'main' | 'detail';

interface AppBarProps {
  type?: AppBarType;
  title?: string;
  onBack?: () => void;
  onSettings?: () => void;
  className?: string;
}

export function AppBar({
  type = 'main',
  title,
  onBack,
  onSettings,
  className,
}: AppBarProps) {
  return (
    <header
      className={cn('bg-bg-primary flex items-center gap-1 px-1', className)}
    >
      {type === 'main' ? (
        <MainAppBar onSettings={onSettings} />
      ) : (
        <DetailAppBar title={title} onBack={onBack} />
      )}
    </header>
  );
}

interface MainAppBarProps {
  onSettings?: () => void;
}

function MainAppBar({ onSettings }: MainAppBarProps) {
  return (
    <>
      <h1 className="t3-500 text-text-high px-5 py-2.5">Moa</h1>
      <div className="flex-1" />
      <IconButton onClick={onSettings} aria-label="설정">
        <SettingsIcon />
      </IconButton>
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
