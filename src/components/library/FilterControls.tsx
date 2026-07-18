import Link from 'next/link'
import { PHONG_CACH, TINH } from '@/lib/constants'

const DT_RANGES = [
  { v: '',        l: 'Tất cả' },
  { v: '0-100',   l: '< 100 m²' },
  { v: '100-200', l: '100–200 m²' },
  { v: '200-300', l: '200–300 m²' },
  { v: '300-',    l: '> 300 m²' },
]

const GOI = [
  { v: '',      l: 'Tất cả gói' },
  { v: 'free',  l: 'FREE — Miễn phí' },
  { v: 'basic', l: 'CƠ BẢN — Đầy đủ' },
]

type SP = Record<string, string | undefined>

// Bộ lọc dùng chung cho sidebar (desktop) và bottom-sheet (mobile) — task 4.5
export function FilterControls({ slug, searchParams }: { slug: string; searchParams: SP }) {
  const build = (overrides: SP) => {
    const p = new URLSearchParams()
    const merged = { ...searchParams, ...overrides, page: '1' }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const qs = p.toString()
    return `/thu-vien-ban-ve/${slug}${qs ? `?${qs}` : ''}`
  }
  const hasFilter = !!(searchParams.phong_cach || searchParams.so_tang || searchParams.goi_tai || searchParams.dt || searchParams.tinh_id)

  const chip = (active: boolean) =>
    `px-2.5 py-1 text-xs rounded border transition-colors ${active
      ? 'bg-blue-600 text-white border-blue-600'
      : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'}`

  return (
    <div className="space-y-6">
      {/* Diện tích */}
      <div>
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Diện tích sàn</h3>
        <div className="flex flex-wrap gap-1.5">
          {DT_RANGES.map(r => (
            <Link key={r.v} href={build({ dt: r.v || undefined })}
                  className={chip((searchParams.dt ?? '') === r.v)}>{r.l}</Link>
          ))}
        </div>
      </div>

      {/* Số tầng */}
      <div>
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Số tầng</h3>
        <div className="flex flex-wrap gap-1.5">
          {['', '1', '2', '3', '4', '5'].map(t => (
            <Link key={t} href={build({ so_tang: t || undefined })}
                  className={chip((searchParams.so_tang ?? '') === t)}>
              {t === '' ? 'Tất cả' : t === '5' ? '5+' : `${t} tầng`}
            </Link>
          ))}
        </div>
      </div>

      {/* Tỉnh / Thành — form select (63 tỉnh) */}
      <div>
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Tỉnh / Thành phố</h3>
        <form method="GET" action={`/thu-vien-ban-ve/${slug}`}>
          {Object.entries(searchParams).map(([k, v]) =>
            v && k !== 'tinh_id' && k !== 'page'
              ? <input key={k} type="hidden" name={k} value={v} /> : null)}
          <select name="tinh_id" defaultValue={searchParams.tinh_id ?? ''}
                  className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm bg-white
                             focus:outline-none focus:border-blue-400">
            <option value="">— Tất cả tỉnh —</option>
            {Object.entries(TINH).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button type="submit"
                  className="mt-2 w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs
                             py-1.5 rounded border border-zinc-300 transition-colors">
            Áp dụng tỉnh
          </button>
        </form>
      </div>

      {/* Phong cách */}
      <div>
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Phong cách</h3>
        <div className="space-y-1">
          <Link href={build({ phong_cach: undefined })}
                className={`block text-sm px-2 py-1.5 rounded transition-colors ${!searchParams.phong_cach
                  ? 'text-blue-600 bg-blue-50 font-medium' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            Tất cả phong cách
          </Link>
          {Object.entries(PHONG_CACH).map(([k, v]) => (
            <Link key={k} href={build({ phong_cach: k })}
                  className={`block text-sm px-2 py-1.5 rounded transition-colors ${searchParams.phong_cach === k
                    ? 'text-blue-600 bg-blue-50 font-medium' : 'text-zinc-600 hover:bg-zinc-100'}`}>
              {v.ten}
            </Link>
          ))}
        </div>
      </div>

      {/* Gói tải */}
      <div>
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">Gói tải</h3>
        <div className="space-y-1">
          {GOI.map(opt => (
            <Link key={opt.v} href={build({ goi_tai: opt.v || undefined })}
                  className={`block text-sm px-2 py-1.5 rounded transition-colors ${(searchParams.goi_tai ?? '') === opt.v
                    ? 'text-blue-600 bg-blue-50 font-medium' : 'text-zinc-600 hover:bg-zinc-100'}`}>
              {opt.l}
            </Link>
          ))}
        </div>
      </div>

      {hasFilter && (
        <Link href={`/thu-vien-ban-ve/${slug}`} className="block text-xs text-red-600 hover:underline">
          × Xóa tất cả bộ lọc
        </Link>
      )}
    </div>
  )
}
