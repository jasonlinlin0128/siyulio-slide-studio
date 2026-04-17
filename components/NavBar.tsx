import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-accent font-black text-base leading-none">S</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-[13px] text-text-primary tracking-tight">
              Siyulio
            </span>
            <span className="text-[9px] text-text-muted tracking-widest uppercase">
              Slide Studio
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/gallery"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            瀏覽簡報
          </Link>
          <Link
            href="/create"
            className="bg-[#111111] text-accent text-sm font-bold px-4 py-2 rounded-md hover:bg-gray-900 transition-colors"
          >
            立即產生
          </Link>
        </div>
      </nav>
    </header>
  );
}
