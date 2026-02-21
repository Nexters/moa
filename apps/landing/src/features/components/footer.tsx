import { GitHubIcon, InstagramIcon } from '~/assets/icons';

export function Footer() {
  return (
    <footer className="bg-bg-primary flex flex-col-reverse gap-4 px-6 pb-10 md:flex-row md:items-start md:px-[68px] md:pb-10 lg:px-[120px] lg:pb-10">
      {/* Left */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="b1-400 text-text-medium flex items-center gap-2">
          <span className="whitespace-nowrap">
            <span className="text-text-high">📩</span> 문의:
          </span>
          <a
            href="mailto:moa.salary@gmail.com"
            className="hover:text-text-high p-1 underline transition-colors"
          >
            moa.salary@gmail.com
          </a>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-[6px]">
            <a
              href="#"
              className="b1-400 text-text-medium hover:text-text-high p-1 underline transition-colors"
            >
              이용약관
            </a>
            <a
              href="#"
              className="b1-400 text-text-medium hover:text-text-high p-1 underline transition-colors"
            >
              개인정보 처리방침
            </a>
          </div>
          <p className="b1-400 text-text-medium">
            Copyright &copy; 2026 Team Moa. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right: social icons */}
      <div className="flex items-center gap-2">
        <a
          href="#"
          aria-label="Instagram"
          className="text-text-low hover:text-text-high flex h-9 w-9 items-center justify-center transition-colors"
        >
          <InstagramIcon className="h-5 w-5" />
        </a>
        <a
          href="https://github.com/nexters/moa"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-text-low hover:text-text-high flex h-9 w-9 items-center justify-center transition-colors"
        >
          <GitHubIcon className="h-5 w-5" />
        </a>
      </div>
    </footer>
  );
}
