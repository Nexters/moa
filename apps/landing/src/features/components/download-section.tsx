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
      className={`bg-container-secondary flex w-full items-center justify-between rounded-[12px] px-5 py-4 transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-gray-60 cursor-pointer'
      }`}
    >
      <span className="b1-500 flex items-center gap-3 text-white">
        <span className="text-text-medium flex h-6 w-6 items-center justify-center">
          {icon}
        </span>
        {label}
      </span>
      <DownloadIcon className="text-text-low h-5 w-5" />
    </button>
  );
}

export function DownloadSection() {
  return (
    <section
      id="download"
      className="bg-bg-secondary px-6 pt-[60px] pb-20 md:px-[68px] md:pt-[100px] md:pb-[160px] lg:px-[120px]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10 flex flex-col items-center md:mb-16">
          <img
            src="/moa/images/coin-rotate.gif"
            alt="코인 아이콘"
            className="mb-6 h-16 w-16 md:h-20 md:w-20"
          />
          <h2 className="t2-700 md:h2-700 mb-2 text-center text-white md:mb-3">
            직장인의 지루한 근무시간
          </h2>
          <h2 className="t2-700 md:h2-700 text-center text-white">
            <span className="text-green-40">모아</span>와 함께 오늘도 힘내요!
          </h2>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-[30px]">
          {/* Mobile */}
          <div className="flex-1">
            <h3 className="c1-500 text-text-low mb-3 uppercase">Mobile</h3>
            <div className="flex flex-col gap-3">
              <DownloadRow
                icon={<AppleIcon className="h-5 w-5" />}
                label="iOS"
              />
              <DownloadRow
                icon={<AndroidIcon className="h-5 w-5" />}
                label="Android"
              />
            </div>
          </div>

          {/* Desktop */}
          <div className="flex-1">
            <h3 className="c1-500 text-text-low mb-3 uppercase">Desktop</h3>
            <div className="flex flex-col gap-3">
              <DownloadRow
                icon={<AppleIcon className="h-5 w-5" />}
                label="macOS"
                href={getDownloadUrl('mac-aarch64')}
              />
              <DownloadRow
                icon={<WindowsIcon className="h-5 w-5" />}
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
