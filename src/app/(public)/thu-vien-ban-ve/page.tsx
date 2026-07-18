import { createPublicClient } from '@/lib/supabase/public'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LOAI_CT, PHONG_CACH } from '@/lib/constants'
import { boDauTiengViet } from '@/lib/site'
import { DrawingCard } from '@/components/library/DrawingCard'
import { SearchBar } from '@/components/library/SearchBar'

export const metadata: Metadata = {
  title: 'Thư viện bản vẽ thiết kế nhà — GiaXayNha.vn',
  description: 'Hơn 300+ bản vẽ thiết kế nhà ở, biệt thự, nhà phố, nhà cấp 4 — tải miễn phí hồ sơ PDF kỹ thuật, dự toán chi tiết từ chuyên gia GiaXayNha.vn.',
}

async function getLibraryData() {
  const supabase = createPublicClient()

  // Đếm bản vẽ theo loại CT bằng RPC group-by (không kéo cả bảng — task 4.8)
  const { data: countRows } = await supabase.rpc('count_ban_ve_by_loai')

  const countByLoai: Record<number, number> = {}
  let tongBanVe = 0
  if (countRows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of countRows as any[]) {
      countByLoai[row.loai_ct] = Number(row.so_luong)
      tongBanVe += Number(row.so_luong)
    }
  }

  // 8 bản vẽ mới nhất / nhiều tải nhất
  const { data: featured } = await supabase
    .from('ban_ve')
    .select(`
      id, ma_gxn, slug, tieu_de, loai_ct, phong_cach_1, goi_tai,
      anh_bia, luot_tai,
      danh_muc:danh_muc_ban_ve(slug)
    `)
    .eq('trang_thai', 'da_xuat')
    .order('luot_tai', { ascending: false })
    .limit(8)

  return { countByLoai, featured: featured ?? [], tongBanVe }
}

// ── Tìm kiếm / lọc theo phong cách (task 1.1, 1.3) ────────────
async function getSearchResults(q: string, phongCach: string) {
  const supabase = createPublicClient()

  let query = supabase
    .from('ban_ve')
    .select(`
      id, ma_gxn, slug, tieu_de, loai_ct, phong_cach_1, goi_tai,
      anh_bia, luot_tai,
      danh_muc:danh_muc_ban_ve(slug)
    `, { count: 'exact' })
    .eq('trang_thai', 'da_xuat')

  if (phongCach) query = query.eq('phong_cach_1', parseInt(phongCach, 10))
  if (q)         query = query.ilike('search_text', `%${boDauTiengViet(q)}%`)

  const { data, count } = await query
    .order('luot_tai', { ascending: false })
    .limit(48)

  return { data: data ?? [], total: count ?? 0 }
}

function SearchResultsView({
  q, phongCach, data, total,
}: {
  q: string; phongCach: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]; total: number
}) {
  const pcName = phongCach ? PHONG_CACH[parseInt(phongCach, 10)]?.ten : null
  const heading = q
    ? `Kết quả cho “${q}”`
    : pcName ? `Phong cách ${pcName}` : 'Kết quả tìm kiếm'

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-zinc-900 pt-10 pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          <SearchBar initialQ={q} />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-baseline justify-between mb-5">
          <h1 className="text-lg font-semibold text-zinc-800">{heading}</h1>
          <span className="text-sm text-zinc-500">{total} bản vẽ</span>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-300 rounded-xl">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-zinc-600 font-medium mb-1">Không tìm thấy bản vẽ phù hợp</p>
            <p className="text-sm text-zinc-400 mb-4">
              Thử từ khoá khác, hoặc duyệt theo loại công trình.
            </p>
            <Link href="/thu-vien-ban-ve" className="text-sm text-blue-600 hover:underline">
              ← Về thư viện
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((bv) => (
              <DrawingCard
                key={bv.id}
                maGXN={bv.ma_gxn}
                slug={bv.slug}
                tieuDe={bv.tieu_de}
                loaiCt={bv.loai_ct}
                phongCach1={bv.phong_cach_1}
                goiTai={bv.goi_tai}
                anhBia={bv.anh_bia}
                luotTai={bv.luot_tai}
                danhMucSlug={(bv.danh_muc as { slug: string } | null)?.slug ?? 'ban-ve'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default async function ThuVienBanVePage({
  searchParams,
}: {
  searchParams: { q?: string; phong_cach?: string }
}) {
  const q  = searchParams.q?.trim() ?? ''
  const pc = searchParams.phong_cach ?? ''

  // Nếu có từ khoá / lọc phong cách → hiển thị trang kết quả
  if (q || pc) {
    const { data, total } = await getSearchResults(q, pc)
    return <SearchResultsView q={q} phongCach={pc} data={data} total={total} />
  }

  const { countByLoai, featured, tongBanVe } = await getLibraryData()

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-zinc-900 pt-14 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400
                          text-xs font-semibold px-3 py-1 rounded-full mb-5 border border-blue-500/20">
            🏗️ {tongBanVe > 0 ? `${tongBanVe}+ bản vẽ` : '300+ bản vẽ'} — Cập nhật liên tục
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
            Thư viện bản vẽ<br />
            <span className="text-blue-400">thiết kế nhà ở</span>
          </h1>
          <p className="text-zinc-400 text-base mb-8 max-w-xl mx-auto">
            Tải miễn phí hồ sơ PDF kỹ thuật · Dự toán chi tiết · Biệt thự, nhà phố, nhà cấp 4
          </p>

          {/* Search */}
          <SearchBar />
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <div className="bg-zinc-800 border-b border-zinc-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-6">
          {[
            { icon: '📐', text: `${tongBanVe > 0 ? tongBanVe + '+' : '300+'} bản vẽ` },
            { icon: '🏙️', text: '63 tỉnh thành' },
            { icon: '🎨', text: '18 phong cách' },
            { icon: '💯', text: 'Miễn phí PDF' },
          ].map(s => (
            <div key={s.text} className="flex items-center gap-1.5 text-zinc-400 text-sm">
              <span>{s.icon}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* ── Loại công trình (3×3) ──────────────────────────── */}
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-lg font-semibold text-zinc-800">Theo loại công trình</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-9 gap-3">
            {Object.entries(LOAI_CT).map(([key, loai]) => {
              const count = countByLoai[Number(key)] ?? 0
              return (
                <Link
                  key={key}
                  href={`/thu-vien-ban-ve/${loai.slug}`}
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-zinc-50 border border-zinc-200
                             rounded-xl hover:bg-blue-50 hover:border-blue-200
                             transition-all duration-150 group text-center"
                >
                  <span className="text-2xl sm:text-3xl">{loai.emoji}</span>
                  <span className="text-xs font-medium text-zinc-700 group-hover:text-blue-700
                                   leading-tight text-center">
                    {loai.ten}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-blue-500">
                    {count > 0 ? `${count} bản vẽ` : loai.soLuong}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Phong cách thiết kế ────────────────────────────── */}
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-lg font-semibold text-zinc-800">Theo phong cách</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PHONG_CACH).map(([key, pc]) => (
              <Link
                key={key}
                href={`/thu-vien-ban-ve?phong_cach=${key}`}
                className="px-3 py-1.5 text-sm text-zinc-600 bg-zinc-100 border border-zinc-200
                           rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200
                           transition-colors"
              >
                {pc.ten}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Bản vẽ nổi bật ────────────────────────────────── */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-lg font-semibold text-zinc-800">Tải nhiều nhất</h2>
              <Link href="/thu-vien-ban-ve/biet-thu"
                    className="text-sm text-blue-600 hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {// eslint-disable-next-line @typescript-eslint/no-explicit-any
              (featured as any[]).map((bv) => (
                <DrawingCard
                  key={bv.id}
                  maGXN={bv.ma_gxn}
                  slug={bv.slug}
                  tieuDe={bv.tieu_de}
                  loaiCt={bv.loai_ct}
                  phongCach1={bv.phong_cach_1}
                  goiTai={bv.goi_tai}
                  anhBia={bv.anh_bia}
                  luotTai={bv.luot_tai}
                  danhMucSlug={(bv.danh_muc as { slug: string } | null)?.slug ?? 'ban-ve'}
                />

              ))}
            </div>
          </section>
        )}

        {/* Empty state khi chưa có bản vẽ */}
        {featured.length === 0 && (
          <section className="text-center py-20 border border-dashed border-zinc-300 rounded-xl">
            <div className="text-5xl mb-4">📐</div>
            <h3 className="text-lg font-semibold text-zinc-700 mb-2">Đang cập nhật nội dung</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Thư viện bản vẽ đang được biên tập viên tải lên.
              Vui lòng quay lại sau.
            </p>
          </section>
        )}
      </div>

      {/* ── Footer mini ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 py-8 px-4 bg-zinc-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-zinc-400">
            © 2024 GiaXayNha.vn · Nền tảng tư vấn xây dựng nhà ở tư nhân
          </p>
        </div>
      </footer>
    </div>
  )
}
