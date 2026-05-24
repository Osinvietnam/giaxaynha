import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NHU_CAU_LABELS, TINH } from '@/lib/constants'

const TRANG_THAI_GD_OPTIONS = [
  { value: '',          label: 'Tất cả' },
  { value: 'cho_goi',   label: 'Chờ gọi' },
  { value: 'dang_tuvan','label': 'Đang tư vấn' },
  { value: 'da_chot',   label: 'Đã chốt' },
  { value: 'khong_dt',  label: 'Không bắt được' },
]

const STATUS_STYLE: Record<string, string> = {
  cho_goi:    'bg-amber-100 text-amber-700 border-amber-200',
  dang_tuvan: 'bg-blue-100  text-blue-700  border-blue-200',
  da_chot:    'bg-green-100 text-green-700 border-green-200',
  khong_dt:   'bg-zinc-100  text-zinc-500  border-zinc-200',
}

const STATUS_LABEL: Record<string, string> = {
  cho_goi:    'Chờ gọi',
  dang_tuvan: 'Đang tư vấn',
  da_chot:    'Đã chốt',
  khong_dt:   'Không bắt được',
}

async function getLeads(params: {
  trang_thai_gd?: string
  q?: string
  page?: string
}) {
  const supabase  = await createClient()
  const PAGE_SIZE = 25
  const page      = Math.max(1, parseInt(params.page ?? '1', 10))
  const from      = (page - 1) * PAGE_SIZE
  const to        = from + PAGE_SIZE - 1

  let query = supabase
    .from('lead_ban_ve')
    .select(`
      id, ho_ten, so_dien_thoai, tinh_id, nhu_cau,
      trang_thai_gd, created_at, drive_url, url_expires_at,
      ban_ve:ban_ve_id(ma_gxn, tieu_de)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.trang_thai_gd) query = query.eq('trang_thai_gd', params.trang_thai_gd)
  if (params.q) query = query.ilike('so_dien_thoai', `%${params.q}%`)

  const { data, count } = await query
  return { data: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE }
}

async function getLeadKPIs() {
  const supabase = await createClient()

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const minus48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const [
    { count: tong },
    { count: homNay },
    { count: chuaGoi },
    { count: qua48h },
  ] = await Promise.all([
    supabase.from('lead_ban_ve').select('*', { count: 'exact', head: true }),
    supabase.from('lead_ban_ve').select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    supabase.from('lead_ban_ve').select('*', { count: 'exact', head: true })
      .eq('trang_thai_gd', 'cho_goi'),
    supabase.from('lead_ban_ve').select('*', { count: 'exact', head: true })
      .eq('trang_thai_gd', 'cho_goi')
      .lte('created_at', minus48h.toISOString()),
  ])

  return {
    tong:    tong    ?? 0,
    homNay:  homNay  ?? 0,
    chuaGoi: chuaGoi ?? 0,
    qua48h:  qua48h  ?? 0,
  }
}

function formatRelativeTime(iso: string) {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)

  if (diff < 60)   return `${diff} phút trước`
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`
  if (diff < 2880) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN')
}

function isQua48h(iso: string) {
  const d   = new Date(iso)
  const now = new Date()
  return (now.getTime() - d.getTime()) > 48 * 60 * 60 * 1000
}

export default async function CMSLeadsPage({
  searchParams,
}: {
  searchParams: { trang_thai_gd?: string; q?: string; page?: string }
}) {
  const [{ data, total, page, pageSize }, kpis] = await Promise.all([
    getLeads(searchParams),
    getLeadKPIs(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { ...searchParams, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    return `/cms/leads?${p.toString()}`
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Leads</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{total} leads</p>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-white border border-zinc-200
                     text-zinc-700 text-sm font-medium px-4 py-2 rounded
                     hover:bg-zinc-50 transition-colors"
          title="Tính năng export sẽ có ở Sprint 3"
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
          </svg>
          Xuất Excel
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-0.5">Tổng leads</p>
          <p className="text-2xl font-bold text-zinc-800">{kpis.tong}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-0.5">Hôm nay</p>
          <p className="text-2xl font-bold text-blue-600">{kpis.homNay}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-0.5">Chưa gọi</p>
          <p className="text-2xl font-bold text-amber-600">{kpis.chuaGoi}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-xs text-zinc-500 mb-0.5">Quá 48h</p>
          <p className={`text-2xl font-bold ${kpis.qua48h > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
            {kpis.qua48h}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-4
                      flex flex-wrap gap-3 items-center">
        <form method="GET" className="flex gap-2 flex-1 min-w-[200px]">
          {searchParams.trang_thai_gd && (
            <input type="hidden" name="trang_thai_gd" value={searchParams.trang_thai_gd} />
          )}
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Tìm số điện thoại..."
            className="flex-1 border border-zinc-300 rounded px-3 py-1.5 text-sm
                       focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <button type="submit"
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm
                             px-3 py-1.5 rounded transition-colors border border-zinc-300">
            Tìm
          </button>
        </form>

        {/* Trạng thái GD */}
        <div className="flex gap-1 flex-wrap">
          {TRANG_THAI_GD_OPTIONS.map(opt => (
            <Link
              key={opt.value}
              href={buildUrl({ trang_thai_gd: opt.value || undefined, page: '1' })}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors
                ${(searchParams.trang_thai_gd ?? '') === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'
                }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {data.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-zinc-500 text-sm">Chưa có lead nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  SĐT / Họ tên
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Bản vẽ
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">
                  Nhu cầu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                  Tỉnh / Thành
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Thời gian
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-28">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {// eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data as any[]).map((lead: {
                id: string
                ho_ten: string | null
                so_dien_thoai: string
                tinh_id: number | null
                nhu_cau: string | null
                trang_thai_gd: string
                created_at: string
                drive_url: string | null
                // Supabase join returns array shape; handle both
                ban_ve: { ma_gxn: string; tieu_de: string } | { ma_gxn: string; tieu_de: string }[] | null
              }) => {
                const qua48 = isQua48h(lead.created_at)
                  && lead.trang_thai_gd === 'cho_goi'
                return (
                  <tr key={lead.id}
                      className={`hover:bg-zinc-50 ${qua48 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-800">
                              {lead.so_dien_thoai}
                            </span>
                            {qua48 && (
                              <span className="text-[10px] bg-red-100 text-red-600
                                               border border-red-200 px-1.5 py-0.5 rounded-full font-semibold">
                                Quá 48h
                              </span>
                            )}
                          </div>
                          {lead.ho_ten && (
                            <p className="text-xs text-zinc-400 mt-0.5">{lead.ho_ten}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lead.ban_ve ? (
                        <div>
                          <p className="text-zinc-700 truncate max-w-[180px] text-xs">
                            {Array.isArray(lead.ban_ve) ? lead.ban_ve[0]?.tieu_de : (lead.ban_ve as {tieu_de: string}).tieu_de}
                          </p>
                          <p className="text-zinc-400 font-mono text-[10px] mt-0.5">
                            {Array.isArray(lead.ban_ve) ? lead.ban_ve[0]?.ma_gxn : (lead.ban_ve as {ma_gxn: string}).ma_gxn}
                          </p>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-zinc-600">
                        {lead.nhu_cau
                          ? NHU_CAU_LABELS[lead.nhu_cau] ?? lead.nhu_cau
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-zinc-500">
                        {lead.tinh_id ? TINH[lead.tinh_id] : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                        text-[10px] font-medium border
                                        ${STATUS_STYLE[lead.trang_thai_gd] ?? ''}`}>
                        {STATUS_LABEL[lead.trang_thai_gd] ?? lead.trang_thai_gd}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-zinc-400">
                        {formatRelativeTime(lead.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`tel:${lead.so_dien_thoai}`}
                        className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700
                                   border border-blue-200 px-2.5 py-1 rounded hover:bg-blue-100
                                   transition-colors font-medium"
                      >
                        📞 Gọi ngay
                      </a>
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
            Trang {page} / {totalPages} · {total} leads
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
