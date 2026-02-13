import { MoaLogo } from '~/assets/icons';

export function Header() {
  return (
    <header className="bg-bg-primary sticky top-0 z-50 h-16">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 md:px-[68px] lg:px-[120px]">
        <MoaLogo className="h-4 w-[52px] text-white" />
        <a
          href="#download"
          className="bg-green-40 text-gray-90 b2-600 flex h-9 items-center rounded-[32px] px-4 transition-opacity hover:opacity-90"
        >
          다운로드
        </a>
      </div>
    </header>
  );
}
