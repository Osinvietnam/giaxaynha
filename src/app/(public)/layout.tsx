import Link from 'next/link'
import { SITE } from '@/lib/site'

// Layout công khai — dùng cho thư viện bản vẽ (không cần auth)
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Top Nav ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          {/* Logo */}
          <Link href="/thu-vien-ban-ve"
                className="text-sm font-bold text-zinc-800 tracking-tight whitespace-nowrap">
            Gia<span className="text-blue-600">Xay</span>Nha
            <span className="text-zinc-400 font-normal">.vn</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/thu-vien-ban-ve"
                  className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900
                             hover:bg-zinc-100 rounded transition-colors">
              Thư viện bản vẽ
            </Link>
            <span className="text-zinc-300 text-xs">·</span>
            <Link href="/bang-gia"
                  className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900
                             hover:bg-zinc-100 rounded transition-colors">
              Bảng giá
            </Link>
          </nav>

          {/* CTA */}
          <div className="ml-auto flex items-center gap-2">
            <a href={`tel:${SITE.hotlineTel}`}
               className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-600
                          hover:text-zinc-900 transition-colors">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd"
                  d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
              </svg>
              {SITE.hotline}
            </a>
            <a href={SITE.zaloUrl} target="_blank" rel="noopener noreferrer"
               className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium
                          px-3 py-1.5 rounded transition-colors whitespace-nowrap">
              Tư vấn miễn phí
            </a>
          </div>
        </div>
      </header>

      {/* Page content */}
      {children}
    </>
  )
}
