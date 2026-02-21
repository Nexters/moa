import { useState } from 'react';
import { cn } from 'tailwind-variants';

import {
  AppleIcon,
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  PlayStoreIcon,
  WindowsIcon,
} from '~/assets/icons';

import { APP_VERSION, getDownloadUrl } from '../app-version';

const BREW_COMMAND = 'brew install --cask nexters/moa';

function HomebrewRow() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(BREW_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-container-secondary flex w-full items-center justify-between rounded-xl px-5 py-4 lg:w-[373px]">
      <span className="b2-400 flex items-center gap-3 font-mono">
        <span className="text-text-low select-none">$</span>
        <span className="text-text-high">{BREW_COMMAND}</span>
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-text-low hover:text-text-high cursor-pointer transition-colors"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <CheckIcon className="text-green-40 size-4" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </button>
    </div>
  );
}

interface DownloadRowProps {
  icon: React.ReactNode;
  label: string;
  arch?: string;
  href?: string;
  rightIcon: React.ReactNode;
}

function DownloadRow({ icon, label, arch, href, rightIcon }: DownloadRowProps) {
  const classes = cn(
    'bg-container-secondary flex w-full items-center justify-between rounded-xl px-5 py-4 transition-colors lg:w-[373px]',
    href
      ? 'hover:bg-interactive-active cursor-pointer'
      : 'cursor-not-allowed opacity-50',
  );

  const content = (
    <>
      <span className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center">{icon}</span>
        <span className="b1-500 flex items-center gap-[6px]">
          <span className="text-text-high">{label}</span>
          {arch && <span className="b1-400 text-text-low">{arch}</span>}
        </span>
      </span>
      {rightIcon}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" disabled className={classes}>
      {content}
    </button>
  );
}

export function DownloadSection() {
  return (
    <section
      id="download"
      className="bg-bg-primary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]"
    >
      <div className="mx-auto flex flex-col items-center gap-10 md:gap-[60px]">
        {/* Header */}
        <div className="flex flex-col items-center gap-8">
          <img
            src="/moa/images/coin-rotate.gif"
            alt="코인 아이콘"
            className="size-20"
          />
          <div className="flex flex-col items-center gap-4 text-center">
            <div>
              <h2 className="t2-700 md:h2-700 text-text-high">
                직장인의 지루한 근무시간
                <br />
                <span className="text-green-40">모아</span>와 함께 오늘도
                힘내요!
              </h2>
            </div>
            <p className="b2-400 md:t3-400 text-text-medium">
              근무 중에도, 모바일로도 언제든 함께할 수 있어요.
            </p>
          </div>
        </div>

        {/* Download area */}
        <div className="flex w-full flex-col gap-10 md:gap-[60px] lg:max-w-[806px]">
          {/* Mobile + Desktop */}
          <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-[60px]">
            {/* Mobile */}
            <div className="flex flex-col gap-[14px]">
              <p className="b1-500 text-text-medium">Mobile</p>
              <div className="flex flex-col gap-3">
                <DownloadRow
                  icon={<AppleIcon className="size-6" />}
                  label="iOS"
                  rightIcon={
                    <ArrowRightIcon className="text-text-low size-4" />
                  }
                />
                <DownloadRow
                  icon={<PlayStoreIcon className="size-6" />}
                  label="Android"
                  rightIcon={
                    <ArrowRightIcon className="text-text-low size-4" />
                  }
                />
              </div>
            </div>

            {/* Desktop */}
            <div className="flex flex-col gap-[14px]">
              <p className="b1-500 text-text-medium flex items-center justify-between">
                <span>Desktop</span>
                <span className="b2-400 text-text-low">v{APP_VERSION}</span>
              </p>
              <div className="flex flex-col gap-3">
                <DownloadRow
                  icon={<AppleIcon className="size-6" />}
                  label="macOS"
                  arch="(Apple Silicon)"
                  href={getDownloadUrl('mac-aarch64')}
                  rightIcon={<DownloadIcon className="text-text-low size-4" />}
                />
                <DownloadRow
                  icon={<AppleIcon className="size-6" />}
                  label="macOS"
                  arch="(Intel)"
                  href={getDownloadUrl('mac-x64')}
                  rightIcon={<DownloadIcon className="text-text-low size-4" />}
                />
                <DownloadRow
                  icon={<WindowsIcon className="size-6" />}
                  label="Windows"
                  arch="(x64)"
                  href={getDownloadUrl('windows-x64')}
                  rightIcon={<DownloadIcon className="text-text-low size-4" />}
                />
                <HomebrewRow />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
