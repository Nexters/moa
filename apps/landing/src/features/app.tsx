import { cn } from 'tailwind-variants';

import { APP_VERSION, getDownloadUrl } from './app-version';

export function App() {
  return (
    <main className="min-h-dvh px-6 py-12 md:px-12 md:py-16">
      {/* Grid Container */}
      <div className="mx-auto max-w-5xl">
        {/* Hero Section */}
        <section className="grid grid-cols-4 gap-4 md:grid-cols-12 md:gap-6">
          {/* Title Block */}
          <div className="col-span-4 mb-8 md:col-span-8 md:mb-16">
            <h1 className="h2-700 md:h1-700 mb-4 md:text-8xl">모아</h1>
            <p className="t3-400 md:t2-400 text-text-medium max-w-md">
              실시간 월급 체감 서비스
            </p>
          </div>

          {/* Links */}
          <div className="col-span-4 md:col-span-4 md:text-right">
            <div className="flex flex-row gap-4 md:flex-col md:items-end md:gap-2">
              <a
                href="https://github.com/nexters/moa"
                target="_blank"
                rel="noopener noreferrer"
                className="b2-400 hover:text-green-40 text-text-medium transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/nexters/moa/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="b2-400 hover:text-green-40 text-text-medium transition-colors"
              >
                Releases
              </a>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="bg-gray-80 my-12 h-px md:my-16" />

        {/* Download Section */}
        <section className="grid grid-cols-4 gap-8 md:grid-cols-12 md:gap-12">
          {/* Desktop */}
          <div className="col-span-4 md:col-span-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="c1-500 text-text-low uppercase">Desktop</h2>
              <span className="b2-500 text-green-40 font-mono">
                v{APP_VERSION}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <DownloadButton
                platform="macOS"
                arch="Apple Silicon"
                href={getDownloadUrl('mac-aarch64')}
              />
              <DownloadButton
                platform="macOS"
                arch="Intel"
                href={getDownloadUrl('mac-x64')}
              />
              <DownloadButton
                platform="Windows"
                arch="x64"
                href={getDownloadUrl('windows-x64')}
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="col-span-4 md:col-span-6">
            <h2 className="c1-500 text-text-low mb-4 uppercase">Mobile</h2>
            <div className="flex flex-col gap-3">
              <DownloadButton platform="iOS" icon={<IOSIcon />} />
              <DownloadButton platform="Android" icon={<AndroidIcon />} />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-gray-80 mt-16 border-t pt-8 md:mt-24">
          <div className="grid grid-cols-4 gap-4 md:grid-cols-12">
            <div className="col-span-4 md:col-span-6">
              <p className="b2-400 text-text-low">
                © 2025 Built with <span className="text-green-40">💚</span>{' '}
                by&nbsp;
                <a
                  href="https://nexters.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-40 text-text-medium transition-colors"
                >
                  Nexters
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function DownloadButton({
  platform,
  arch,
  href,
  icon,
}: {
  platform: string;
  arch?: string;
  href?: string;
  icon?: React.ReactNode;
}) {
  const disabled = !href;

  const handleClick = () => {
    if (href) {
      window.open(href, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'group border-gray-70 flex items-center justify-between border px-4 py-3 transition-all',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-gray-80 cursor-pointer hover:border-green-50',
      )}
    >
      <span className="b2-400 flex items-center gap-2">
        {icon}
        {platform} {arch && <span className="text-text-low">({arch})</span>}
      </span>
      {disabled ? (
        <span className="c1-400">Coming Soon</span>
      ) : (
        <svg
          className="text-text-low group-hover:text-green-40 h-4 w-4 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )}
    </button>
  );
}

function IOSIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
    </svg>
  );
}
