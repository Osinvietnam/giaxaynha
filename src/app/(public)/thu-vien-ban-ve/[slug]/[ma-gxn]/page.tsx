import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LOAI_CT, PHONG_CACH, TINH } from '@/lib/constants'
import { DownloadGate } from '@/components/library/DownloadGate'
import { DrawingCard } from '@/components/library/DrawingCard'

interface PageProps {
  params: { slug: string; 'ma-gxn': string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ban_ve')
    .select('tieu_de, seo_title, seo_description, anh_bia')
    .eq('ma_gxn', params['ma-gxn'])
    .eq('trang_thai', 'da_xuat')
    .single()

  if (!data) return { title: 'Bản vẽ không tìm thấy' }

  return {
    title: data.seo_title ?? `${data.tieu_de} — GiaXayNha.vn`,
    description: data.seo_description ?? undefined,
    openGraph: data.anh_bia
      ? { images: [{ url: data.anh_bia }] }
      : undefined,
  }
}

async function getDrawing(maGXN: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ban_ve')
    .select(`
      id, ma_gxn, tieu_de, slug,
      loai_ct, phong_cach_1, phong_cach_2,
      chieu_dai, chieu_rong, so_tang, dien_tich_san, so_phong_ngu,
      tinh_id, mo_ta, the_tag,
      anh_bia, anh_phu,
      file_pdf_url, goi_tai,
      luot_xem, luot_tai,
      trang_thai,
      danh_muc:danh_muc_ban_ve(ten, slug)
    `)
    .eq('ma_gxn', maGXN)
    .eq('trang_thai', 'da_xuat')
    .single()

  if (data) {
    // Increment lượt xem (non-blocking)
    supabase.rpc('increment_luot_xem', { ban_ve_id: data.id }).then(() => {})
  }

  return data
}

async function getRelated(loaiCt: number, excludeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ban_ve')
    .select(`
      id, ma_gxn, tieu_de, loai_ct, phong_cach_1, goi_tai,
      anh_bia, luot_tai,
      danh_muc:danh_muc_ban_ve(slug)
    `)
    .eq('trang_thai', 'da_xuat')
    .eq('loai_ct', loaiCt)
    .neq('id', excludeId)
    .order('luot_tai', { ascending: false })
    .limit(4)

  return data ?? []
}

export default async function DrawingDetailPage({ params }: PageProps) {
  const maGXN  = params['ma-gxn']
  const bv     = await getDrawing(maGXN)

  if (!bv) notFound()

  const loai   = LOAI_CT[bv.loai_ct]
  const phong1 = PHONG_CACH[bv.phong_cach_1]
  const phong2 = bv.phong_cach_2 ? PHONG_CACH[bv.phong_cach_2] : null
  const tinh   = bv.tinh_id ? TINH[bv.tinh_id] : null
  // Supabase join may return single object or array; normalise to object | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDanhMuc = bv.danh_muc as any
  const danh_muc: { ten: string; slug: string } | null = Array.isArray(rawDanhMuc)
    ? (rawDanhMuc[0] ?? null)
    : rawDanhMuc ?? null

  const related = await getRelated(bv.loai_ct, bv.id)

  const allImages = [bv.anh_bia, ...(bv.anh_phu ?? [])].filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3">
        <nav className="max-w-6xl mx-auto text-xs text-zinc-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/thu-vien-ban-ve" className="hover:text-zinc-700 transition-colors">
            Thư viện bản vẽ
          </Link>
          <span>›</span>
          {danh_muc && (
            <>
              <Link href={`/thu-vien-ban-ve/${danh_muc.slug}`}
                    className="hover:text-zinc-700 transition-colors">
                {danh_muc.ten}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-zinc-800 font-medium truncate max-w-[200px]">{bv.tieu_de}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Gallery (2/3) ──────────────────────────────── */}
          <div className="lg:col-span-2">
            {/* Main image */}
            <div className="aspect-[4/3] bg-zinc-100 rounded-xl overflow-hidden mb-3">
              {allImages[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={allImages[0]}
                  alt={bv.tieu_de}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <span className="text-6xl opacity-30">{loai?.emoji ?? '🏠'}</span>
                  <span className="text-sm text-zinc-400">Chưa có ảnh phối cảnh</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.slice(0, 6).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img}
                    alt={`${bv.tieu_de} - ${i + 1}`}
                    className="w-20 h-14 object-cover rounded-lg border-2 border-transparent
                               hover:border-blue-500 cursor-pointer transition-all shrink-0"
                  />
                ))}
              </div>
            )}

            {/* Mô tả */}
            {bv.mo_ta && (
              <div className="mt-6">
                <h2 className="text-base font-semibold text-zinc-800 mb-3">Mô tả bản vẽ</h2>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                  {bv.mo_ta}
                </p>
              </div>
            )}

            {/* Tags */}
            {bv.the_tag && bv.the_tag.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {bv.the_tag.map((tag: string) => (
                  <span key={tag}
                        className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Info card + Download (1/3) ──────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-zinc-400 bg-zinc-100
                                   px-2 py-0.5 rounded border border-zinc-200">
                    {bv.ma_gxn}
                  </span>
                  {bv.goi_tai === 'free'
                    ? <span className="badge-free">FREE</span>
                    : <span className="badge-basic">CƠ BẢN</span>
                  }
                </div>
                <h1 className="text-lg font-bold text-zinc-900 leading-snug">
                  {bv.tieu_de}
                </h1>
              </div>

              {/* Thông số */}
              <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 mb-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  Thông số kỹ thuật
                </h3>
                <dl className="space-y-2">
                  <InfoRow label="Loại CT" value={loai?.ten} />
                  <InfoRow label="Phong cách"
                    value={[phong1?.ten, phong2?.ten].filter(Boolean).join(' / ')} />
                  {bv.chieu_dai && bv.chieu_rong && (
                    <InfoRow label="Kích thước"
                      value={`${bv.chieu_dai}m × ${bv.chieu_rong}m`} />
                  )}
                  {bv.so_tang && (
                    <InfoRow label="Số tầng" value={`${bv.so_tang} tầng`} />
                  )}
                  {bv.dien_tich_san && (
                    <InfoRow label="Diện tích sàn" value={`${bv.dien_tich_san} m²`} />
                  )}
                  {bv.so_phong_ngu && (
                    <InfoRow label="Phòng ngủ" value={`${bv.so_phong_ngu} PN`} />
                  )}
                  {tinh && (
                    <InfoRow label="Khu vực" value={tinh} />
                  )}
                </dl>
              </div>

              {/* Gói tải */}
              <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 mb-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  File bao gồm
                </h3>
                {bv.goi_tai === 'free' ? (
                  <ul className="space-y-1.5 text-sm text-zinc-600">
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Mặt bằng tổng thể (PDF)</li>
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Phối cảnh 3D (PDF)</li>
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Khái toán chi phí</li>
                  </ul>
                ) : (
                  <ul className="space-y-1.5 text-sm text-zinc-600">
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Hồ sơ KT đầy đủ (PDF)</li>
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Kết cấu + Điện nước</li>
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Dự toán chi tiết (Excel)</li>
                  </ul>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-zinc-400 mb-4">
                <span>👁 {bv.luot_xem.toLocaleString('vi-VN')} lượt xem</span>
                <span>📥 {bv.luot_tai.toLocaleString('vi-VN')} lượt tải</span>
              </div>

              {/* Download button */}
              <DownloadGate
                banVeId={bv.id}
                tieuDe={bv.tieu_de}
                maGXN={bv.ma_gxn}
                goiTai={bv.goi_tai as 'free' | 'basic'}
              />

              <p className="text-xs text-zinc-400 text-center mt-3">
                Link tải có hiệu lực 72 giờ sau khi nhận
              </p>
            </div>
          </div>
        </div>

        {/* ── Bản vẽ liên quan ──────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-zinc-800">
                Bản vẽ {loai?.ten} khác
              </h2>
              {danh_muc && (
                <Link href={`/thu-vien-ban-ve/${danh_muc.slug}`}
                      className="text-sm text-blue-600 hover:underline">
                  Xem tất cả →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {// eslint-disable-next-line @typescript-eslint/no-explicit-any
              (related as any[]).map((r) => (
                <DrawingCard
                  key={r.id}
                  maGXN={r.ma_gxn}
                  tieuDe={r.tieu_de}
                  loaiCt={r.loai_ct}
                  phongCach1={r.phong_cach_1}
                  goiTai={r.goi_tai}
                  anhBia={r.anh_bia}
                  luotTai={r.luot_tai}
                  danhMucSlug={r.danh_muc?.slug ?? params.slug}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-xs text-zinc-500 shrink-0">{label}</dt>
      <dd className="text-xs text-zinc-700 font-medium text-right">{value}</dd>
    </div>
  )
}
