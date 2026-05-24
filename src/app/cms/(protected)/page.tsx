import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'


async function getDashboardData() {
  const supabase = await createClient()

  // Đếm bản vẽ theo trạng thái
  const { data: banVeList } = await supabase
    .from('ban_ve')
    .select('trang_thai')

  const dem = { tong: 0, nhap: 0, cho_duyet: 0, da_xuat: 0 }
  if (banVeList) {
    dem.tong = banVeList.length
    for (const bv of banVeList) {
      if (bv.trang_thai === 'nhap')      dem.nhap++
      if (bv.trang_thai === 'cho_duyet') dem.cho_duyet++
      if (bv.trang_thai === 'da_xuat')   dem.da_xuat++
    }
  }

  // Leads hôm nay
  const hom_nay = new Date()
  hom_nay.setHours(0, 0, 0, 0)
  const { count: leadsHomNay } = await supabase
    .from('lead_ban_ve')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', hom_nay.toISOString())

  // 5 leads gần nhất
  const { data: recentLeads } = await supabase
    .from('lead_ban_ve')
    .select('id, ho_ten, so_dien_thoai, nhu_cau, trang_thai_gd, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Cần duyệt
  const { data: choDuyet } = await supabase
    .from('ban_ve')
    .select('id, ma_gxn, tieu_de, created_at')
    .eq('trang_thai', 'cho_duyet')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    dem,
    leadsHomNay: leadsHomNay ?? 0,
    recentLeads: recentLeads ?? [],
    choDuyet: choDuyet ?? [],
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000) // minutes

  if (diff < 60)  return `${diff} phút trước`
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`
  return d.toLocaleDateString('vi-VN')
}

const NHU_CAU_SHORT: Record<string, string> = {
  tham_khao:    'Tham khảo',
  muon_thicong: 'Thi công',
  can_tuvan:    'Tư vấn',
  khac:         'Khác',
}

const TRANG_THAI_GD_STYLE: Record<string, string> = {
  cho_goi:     'bg-amber-100 text-amber-700',
  dang_tuvan:  'bg-blue-100  text-blue-700',
  da_chot:     'bg-green-100 text-green-700',
  khong_dt:    'bg-zinc-100  text-zinc-500',
}

export default async function CMSDashboardPage() {
  const { dem, leadsHomNay, recentLeads, choDuyet } = await getDashboardData()

  const now = new Date()
  const ngay = now.toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-800">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5 capitalize">{ngay}</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Đã xuất bản"  value={dem.da_xuat}   color="text-green-600" />
        <StatCard label="Chờ duyệt"    value={dem.cho_duyet} color="text-amber-600"
                  badge={dem.cho_duyet > 0 ? `${dem.cho_duyet} mới` : undefined} />
        <StatCard label="Bản nháp"     value={dem.nhap}      color="text-zinc-700" />
        <StatCard label="Leads hôm nay" value={leadsHomNay}  color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chờ duyệt */}
        <section className="bg-white rounded-lg border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-800">Chờ duyệt</h2>
            <Link href="/cms/ban-ve?trang_thai=cho_duyet"
                  className="text-xs text-blue-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>

          {choDuyet.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-zinc-500">Không có bản vẽ nào chờ duyệt</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {choDuyet.map(bv => (
                <li key={bv.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate">{bv.tieu_de}</p>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{bv.ma_gxn}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatTime(bv.created_at)}</span>
                    <Link href={`/cms/ban-ve`}
                          className="text-xs bg-amber-50 text-amber-700 border border-amber-200
                                     px-2 py-0.5 rounded hover:bg-amber-100 transition-colors">
                      Duyệt
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Leads gần nhất */}
        <section className="bg-white rounded-lg border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-800">Leads gần nhất</h2>
            <Link href="/cms/leads" className="text-xs text-blue-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📭</div>
              <p className="text-sm text-zinc-500">Chưa có lead nào</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recentLeads.map((lead: {
                id: string
                ho_ten: string | null
                so_dien_thoai: string
                nhu_cau: string | null
                trang_thai_gd: string
                created_at: string
              }) => (
                <li key={lead.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-800">
                        {lead.so_dien_thoai}
                      </span>
                      {lead.nhu_cau && (
                        <span className="text-xs text-zinc-500">
                          · {NHU_CAU_SHORT[lead.nhu_cau] ?? lead.nhu_cau}
                        </span>
                      )}
                    </div>
                    {lead.ho_ten && (
                      <p className="text-xs text-zinc-400 mt-0.5">{lead.ho_ten}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatTime(lead.created_at)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                                     ${TRANG_THAI_GD_STYLE[lead.trang_thai_gd] ?? ''}`}>
                      {lead.trang_thai_gd === 'cho_goi'    ? 'Chờ gọi'
                     : lead.trang_thai_gd === 'dang_tuvan' ? 'Tư vấn'
                     : lead.trang_thai_gd === 'da_chot'    ? 'Đã chốt'
                     : 'Không bắt được'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Link href="/cms/ban-ve/them-moi"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                         text-white text-sm font-medium px-4 py-2 rounded transition-colors">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Thêm bản vẽ mới
        </Link>
        <Link href="/cms/leads"
              className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50
                         text-zinc-700 text-sm font-medium px-4 py-2 rounded
                         border border-zinc-200 transition-colors">
          Xem leads ({leadsHomNay} hôm nay)
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  label, value, color, badge,
}: {
  label: string
  value: number
  color: string
  badge?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        {badge && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold mt-1.5 ${color}`}>{value}</p>
    </div>
  )
}
