import { MoaLogo } from '~/assets/icons';

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16">
      <div className="mx-auto flex h-full items-center justify-between px-6 md:px-[68px] lg:px-[120px]">
        <MoaLogo className="h-[18px] w-[58px] text-white" />
        <a
          href="#download"
          className="b1-600 px-[10px] py-1 text-white transition-opacity hover:opacity-70"
        >
          다운로드
        </a>
      </div>
    </header>
  );
}
