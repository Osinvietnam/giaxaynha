import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LOAI_CT } from '@/lib/constants'

const TRANG_THAI_OPTIONS = [
  { value: '',          label: 'Tất cả' },
  { value: 'nhap',      label: 'Nháp' },
  { value: 'cho_duyet', label: 'Chờ duyệt' },
  { value: 'da_xuat',   label: 'Đã xuất bản' },
  { value: 'an',        label: 'Ẩn' },
]

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  nhap:      { label: 'Nháp',          cls: 'badge-status-draft'     },
  cho_duyet: { label: 'Chờ duyệt',     cls: 'badge-status-pending'   },
  da_xuat:   { label: 'Đã xuất bản',   cls: 'badge-status-published' },
  an:        { label: 'Ẩn',            cls: 'badge-status-draft'     },
}

async function getBanVeList(params: {
  trang_thai?: string
  loai_ct?: string
  q?: string
  page?: string
}) {
  const supabase = await createClient()
  const PAGE_SIZE = 20
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('ban_ve')
    .select('id, ma_gxn, tieu_de, loai_ct, goi_tai, trang_thai, luot_tai, anh_bia, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.trang_thai) query = query.eq('trang_thai', params.trang_thai)
  if (params.loai_ct)    query = query.eq('loai_ct', parseInt(params.loai_ct, 10))
  if (params.q)          query = query.ilike('tieu_de', `%${params.q}%`)

  const { data, count } = await query
  return { data: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE }
}

async function getStatusCounts() {
  const supabase = await createClient()
  const { data } = await supabase.from('ban_ve').select('trang_thai')
  const counts: Record<string, number> = {}
  if (data) for (const bv of data) {
    counts[bv.trang_thai] = (counts[bv.trang_thai] ?? 0) + 1
  }
  return counts
}

export default async function CMSBanVeListPage({
  searchParams,
}: {
  searchParams: { trang_thai?: string; loai_ct?: string; q?: string; page?: string }
}) {
  const [{ data, total, page, pageSize }, counts] = await Promise.all([
    getBanVeList(searchParams),
    getStatusCounts(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { ...searchParams, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    return `/cms/ban-ve?${p.toString()}`
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Bản vẽ</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{total} bản vẽ</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cms/ban-ve/import"
            className="inline-flex items-center gap-2 bg-white border border-zinc-300 hover:bg-zinc-50
                       text-zinc-700 text-sm font-medium px-4 py-2 rounded transition-colors"
          >
            ⬆ Import Excel
          </Link>
          <Link
            href="/cms/ban-ve/them-moi"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                       text-white text-sm font-medium px-4 py-2 rounded transition-colors"
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Thêm mới
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'Đã xuất bản', key: 'da_xuat',   color: 'text-green-600' },
          { label: 'Chờ duyệt',   key: 'cho_duyet', color: 'text-amber-600' },
          { label: 'Nháp',        key: 'nhap',       color: 'text-zinc-600'  },
          { label: 'Ẩn',          key: 'an',         color: 'text-zinc-400'  },
        ].map(s => (
          <div key={s.key}
               className="bg-white border border-zinc-200 rounded-lg px-4 py-3 min-w-[110px]">
            <p className="text-xs text-zinc-500 mb-0.5">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{counts[s.key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-4
                      flex flex-wrap gap-3 items-center">
        {/* Search */}
        <form method="GET" className="flex gap-2 flex-1 min-w-[200px]">
          {searchParams.trang_thai && (
            <input type="hidden" name="trang_thai" value={searchParams.trang_thai} />
          )}
          {searchParams.loai_ct && (
            <input type="hidden" name="loai_ct" value={searchParams.loai_ct} />
          )}
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Tìm theo tiêu đề..."
            className="flex-1 border border-zinc-300 rounded px-3 py-1.5 text-sm
                       focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <button type="submit"
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm
                             px-3 py-1.5 rounded transition-colors border border-zinc-300">
            Tìm
          </button>
        </form>

        {/* Trạng thái */}
        <div className="flex gap-1 flex-wrap">
          {TRANG_THAI_OPTIONS.map(opt => (
            <Link
              key={opt.value}
              href={buildUrl({ trang_thai: opt.value || undefined, page: '1' })}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors
                ${(searchParams.trang_thai ?? '') === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'
                }`}
            >
              {opt.label}
              {opt.value && counts[opt.value] !== undefined
                ? ` (${counts[opt.value]})`
                : ''}
            </Link>
          ))}
        </div>

        {/* Loại CT — trong form riêng để submit bằng GET */}
        <form method="GET" className="flex gap-1 items-center">
          {searchParams.trang_thai && (
            <input type="hidden" name="trang_thai" value={searchParams.trang_thai} />
          )}
          {searchParams.q && (
            <input type="hidden" name="q" value={searchParams.q} />
          )}
          <select
            name="loai_ct"
            defaultValue={searchParams.loai_ct ?? ''}
            className="border border-zinc-300 rounded px-3 py-1.5 text-sm text-zinc-600
                       focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">Tất cả loại CT</option>
            {Object.entries(LOAI_CT).map(([k, v]) => (
              <option key={k} value={k}>{v.ten}</option>
            ))}
          </select>
          <button type="submit"
                  className="text-xs px-2.5 py-1.5 bg-zinc-100 border border-zinc-300
                             rounded hover:bg-zinc-200 transition-colors text-zinc-600">
            Lọc
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {data.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-zinc-500 text-sm">Không có bản vẽ nào</p>
            <Link href="/cms/ban-ve/them-moi"
                  className="mt-4 inline-block text-blue-600 text-sm hover:underline">
              + Thêm bản vẽ đầu tiên
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500
                               uppercase tracking-wide w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500
                               uppercase tracking-wide">
                  Bản vẽ
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500
                               uppercase tracking-wide hidden md:table-cell">
                  Loại
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500
                               uppercase tracking-wide hidden sm:table-cell">
                  Trạng thái
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500
                               uppercase tracking-wide hidden lg:table-cell">
                  Lượt tải
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500
                               uppercase tracking-wide hidden lg:table-cell">
                  Ngày tạo
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500
                               uppercase tracking-wide w-28">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.map((bv: {
                id: string
                ma_gxn: string
                tieu_de: string
                loai_ct: number
                goi_tai: string
                trang_thai: string
                luot_tai: number
                anh_bia: string | null
                created_at: string
              }, idx) => {
                const loai   = LOAI_CT[bv.loai_ct]
                const status = STATUS_BADGE[bv.trang_thai]
                const row    = (page - 1) * pageSize + idx + 1
                return (
                  <tr key={bv.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-400 text-xs">{row}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-9 rounded bg-zinc-100 overflow-hidden shrink-0
                                        flex items-center justify-center">
                          {bv.anh_bia
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={bv.anh_bia} alt="" className="w-full h-full object-cover" />
                            : <span className="text-sm">{loai?.emoji ?? '🏠'}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-800 truncate max-w-[240px]">
                            {bv.tieu_de}
                          </p>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">{bv.ma_gxn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-zinc-600">{loai?.ten}</span>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium
                        ${bv.goi_tai === 'free'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-blue-50 text-blue-700'}`}>
                        {bv.goi_tai === 'free' ? 'FREE' : 'CƠ BẢN'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={status?.cls ?? 'badge-status-draft'}>
                        {status?.label ?? bv.trang_thai}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-zinc-600">{bv.luot_tai.toLocaleString('vi-VN')}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-xs text-zinc-400">
                        {new Date(bv.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/cms/ban-ve/${bv.id}/sua`}
                              className="text-xs text-zinc-500 hover:text-blue-600 transition-colors">
                          Sửa
                        </Link>
                        <span className="text-zinc-300">|</span>
                        <Link href={`/thu-vien-ban-ve/preview/${bv.ma_gxn}`}
                              target="_blank"
                              className="text-xs text-zinc-500 hover:text-blue-600 transition-colors">
                          Xem
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">
            Trang {page} / {totalPages} · {total} bản vẽ
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                    className="px-3 py-1.5 text-sm border border-zinc-300 rounded
                               hover:bg-zinc-50 text-zinc-600 transition-colors">
                ← Trước
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                    className="px-3 py-1.5 text-sm border border-zinc-300 rounded
                               hover:bg-zinc-50 text-zinc-600 transition-colors">
                Sau →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
