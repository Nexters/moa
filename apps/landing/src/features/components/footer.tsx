import { GitHubIcon, InstagramIcon } from '~/assets/icons';

export function Footer() {
  return (
    <footer className="bg-bg-secondary px-6 pt-0 pb-10 md:px-[68px] md:pb-16 lg:px-[120px]">
      <div className="bg-divider-secondary mx-auto mb-8 h-px max-w-[1200px] md:mb-12" />
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left: contact + links */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <a
              href="mailto:nexters.moa@gmail.com"
              className="b2-400 text-text-medium transition-colors hover:text-white"
            >
              nexters.moa@gmail.com
            </a>
            <div className="flex gap-4">
              <a
                href="#"
                className="b2-400 text-text-low transition-colors hover:text-white"
              >
                이용약관
              </a>
              <a
                href="#"
                className="b2-400 text-text-low transition-colors hover:text-white"
              >
                개인정보처리방침
              </a>
            </div>
          </div>

          {/* Right: social icons */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="text-text-low transition-colors hover:text-white"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/nexters/moa"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-text-low transition-colors hover:text-white"
            >
              <GitHubIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <p className="c1-400 text-text-low mt-6">
          &copy; 2025 MOA. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
