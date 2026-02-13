import {
  AppleIcon,
  AndroidIcon,
  DownloadIcon,
  WindowsIcon,
} from '~/assets/icons';

import { getDownloadUrl } from '../app-version';

interface DownloadRowProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
}

function DownloadRow({ icon, label, href }: DownloadRowProps) {
  const disabled = !href;

  const handleClick = () => {
    if (href) window.open(href, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`bg-container-secondary flex w-full items-center justify-between rounded-[12px] px-5 py-4 transition-colors lg:w-[373px] ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-gray-60 cursor-pointer'
      }`}
    >
      <span className="b1-500 flex items-center gap-[14px] text-white">
        <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
        {label}
      </span>
      <DownloadIcon className="text-text-low h-[18px] w-[18px]" />
    </button>
  );
}

export function DownloadSection() {
  return (
    <section
      id="download"
      className="bg-bg-secondary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]"
    >
      <div className="mx-auto flex flex-col items-center gap-10 md:gap-[60px]">
        {/* Header */}
        <div className="flex flex-col items-center gap-8">
          <img
            src="/moa/images/coin-rotate.gif"
            alt="코인 아이콘"
            className="h-20 w-20"
          />
          <div className="flex flex-col items-center gap-4 text-center">
            <div>
              <h2 className="t2-700 md:h2-700 text-white">
                직장인의 지루한 근무시간
              </h2>
              <h2 className="t2-700 md:h2-700 text-white">
                <span className="text-green-40">모아</span>와 함께 오늘도
                힘내요!
              </h2>
            </div>
            <p className="t3-400 text-text-medium">
              근무 중에도, 모바일로도 언제든 함께할 수 있어요.
            </p>
          </div>
        </div>

        {/* Download rows */}
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:justify-center lg:gap-[60px]">
          {/* Mobile */}
          <div className="flex flex-col gap-[14px]">
            <p className="b1-500 text-text-medium">Mobile</p>
            <div className="flex flex-col gap-3">
              <DownloadRow
                icon={<AppleIcon className="h-6 w-6" />}
                label="iOS"
              />
              <DownloadRow
                icon={<AndroidIcon className="h-6 w-6" />}
                label="Android"
              />
            </div>
          </div>

          {/* Desktop */}
          <div className="flex flex-col gap-[14px]">
            <p className="b1-500 text-text-medium">Desktop</p>
            <div className="flex flex-col gap-3">
              <DownloadRow
                icon={<AppleIcon className="h-6 w-6" />}
                label="macOS"
                href={getDownloadUrl('mac-aarch64')}
              />
              <DownloadRow
                icon={<WindowsIcon className="h-6 w-6" />}
                label="Windows"
                href={getDownloadUrl('windows-x64')}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
