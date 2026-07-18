import { createPublicClient } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LOAI_CT, PAGE_SIZE } from '@/lib/constants'
import { DrawingCard } from '@/components/library/DrawingCard'
import { FilterControls } from '@/components/library/FilterControls'
import { MobileFilterSheet } from '@/components/library/MobileFilterSheet'

// Map danh_muc slug → loai_ct number
const SLUG_TO_LOAI: Record<string, number> = Object.fromEntries(
  Object.entries(LOAI_CT).map(([k, v]) => [v.slug, Number(k)])
)

interface PageProps {
  params: { slug: string }
  searchParams: {
    phong_cach?: string
    so_tang?: string
    goi_tai?: string
    dt?: string
    tinh_id?: string
    sort?: string
    page?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const loaiCtId = SLUG_TO_LOAI[params.slug]
  const loai     = loaiCtId ? LOAI_CT[loaiCtId] : null

  if (!loai) return { title: 'Không tìm thấy' }

  return {
    title: `Bản vẽ ${loai.ten} — GiaXayNha.vn`,
    description: `Tải miễn phí hồ sơ bản vẽ thiết kế ${loai.ten.toLowerCase()} — mặt bằng, phối cảnh, dự toán chi tiết từ GiaXayNha.vn`,
  }
}

async function fetchDrawings(params: PageProps['searchParams'] & { loaiCt: number }) {
  const supabase   = createPublicClient()
  const page       = Math.max(1, parseInt(params.page ?? '1', 10))
  const from       = (page - 1) * PAGE_SIZE
  const to         = from + PAGE_SIZE - 1

  let query = supabase
    .from('ban_ve')
    .select(`
      id, ma_gxn, slug, tieu_de, loai_ct, phong_cach_1, goi_tai,
      anh_bia, luot_tai,
      danh_muc:danh_muc_ban_ve(slug)
    `, { count: 'exact' })
    .eq('trang_thai', 'da_xuat')
    .eq('loai_ct', params.loaiCt)
    .range(from, to)

  if (params.phong_cach) query = query.eq('phong_cach_1', parseInt(params.phong_cach, 10))
  if (params.so_tang)    query = query.eq('so_tang', parseInt(params.so_tang, 10))
  if (params.goi_tai)    query = query.eq('goi_tai', params.goi_tai)
  if (params.tinh_id)    query = query.eq('tinh_id', parseInt(params.tinh_id, 10))
  if (params.dt) {
    const [min, max] = params.dt.split('-')
    if (min) query = query.gte('dien_tich_san', parseFloat(min))
    if (max) query = query.lte('dien_tich_san', parseFloat(max))
  }

  // Sort
  switch (params.sort) {
    case 'xem_nhieu': query = query.order('luot_xem', { ascending: false }); break
    case 'tai_nhieu': query = query.order('luot_tai', { ascending: false }); break
    default:          query = query.order('created_at', { ascending: false })
  }

  const { data, count } = await query
  return { data: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const loaiCtId = SLUG_TO_LOAI[params.slug]
  if (!loaiCtId) notFound()

  const loai = LOAI_CT[loaiCtId]
  const { data, total, page, pageSize } = await fetchDrawings({
    ...searchParams,
    loaiCt: loaiCtId,
  })

  const totalPages = Math.ceil(total / pageSize)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { ...searchParams, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    const qs = p.toString()
    return `/thu-vien-ban-ve/${params.slug}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sub-header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-zinc-500 mb-3 flex items-center gap-1.5">
            <Link href="/thu-vien-ban-ve" className="hover:text-zinc-300 transition-colors">
              Thư viện bản vẽ
            </Link>
            <span>›</span>
            <span className="text-zinc-300">{loai.ten}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{loai.emoji}</span>
            <div>
              <h1 className="text-lg font-bold text-white">{loai.ten}</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{total} bản vẽ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* ── Sidebar (desktop) ───────────────────────────── */}
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="sticky top-20">
              <FilterControls slug={params.slug} searchParams={searchParams} />
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Nút lọc mobile */}
            <div className="mb-4">
              <MobileFilterSheet>
                <FilterControls slug={params.slug} searchParams={searchParams} />
              </MobileFilterSheet>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-zinc-500">
                {total > 0
                  ? `Tìm thấy ${total} bản vẽ`
                  : 'Không tìm thấy bản vẽ nào'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Sắp xếp:</span>
                <div className="flex gap-1">
                  {[
                    { value: 'moi_nhat', label: 'Mới nhất' },
                    { value: 'tai_nhieu', label: 'Tải nhiều' },
                    { value: 'xem_nhieu', label: 'Xem nhiều' },
                  ].map(s => (
                    <Link
                      key={s.value}
                      href={buildUrl({ sort: s.value, page: '1' })}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors
                        ${(searchParams.sort ?? 'moi_nhat') === s.value
                          ? 'bg-zinc-800 text-white border-zinc-800'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            {data.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-300 rounded-xl">
                <div className="text-4xl mb-3">{loai.emoji}</div>
                <p className="text-zinc-600 font-medium mb-1">Chưa có bản vẽ nào</p>
                <p className="text-sm text-zinc-400">
                  Nội dung đang được cập nhật. Quay lại sau.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (data as any[]).map((bv) => (
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
                      danhMucSlug={(bv.danh_muc as { slug: string } | null)?.slug ?? params.slug}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                      <Link href={buildUrl({ page: String(page - 1) })}
                            className="px-4 py-2 text-sm border border-zinc-300 rounded-lg
                                       hover:bg-zinc-50 text-zinc-600 transition-colors">
                        ← Trước
                      </Link>
                    )}
                    <span className="text-sm text-zinc-500">
                      Trang {page} / {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link href={buildUrl({ page: String(page + 1) })}
                            className="px-4 py-2 text-sm border border-zinc-300 rounded-lg
                                       hover:bg-zinc-50 text-zinc-600 transition-colors">
                        Sau →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
