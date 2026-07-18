import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LOAI_CT, PHONG_CACH, TINH } from '@/lib/constants'
import { DownloadGate } from '@/components/library/DownloadGate'
import { DrawingCard } from '@/components/library/DrawingCard'
import { Gallery } from '@/components/library/Gallery'
import { ViewBeacon } from '@/components/library/ViewBeacon'
import { JsonLd } from '@/components/seo/JsonLd'
import { DOWNLOAD, BASE_URL, SITE } from '@/lib/site'

interface PageProps {
  params: { slug: string; 'ban-ve': string }
}

// ISR: phục vụ từ CDN, làm mới mỗi giờ (task 3.1)
export const revalidate = 3600

// Prebuild top bản vẽ tải nhiều nhất (task 3.2); còn lại sinh on-demand
export async function generateStaticParams() {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('ban_ve')
      .select('slug, danh_muc:danh_muc_ban_ve(slug)')
      .eq('trang_thai', 'da_xuat')
      .order('luot_tai', { ascending: false })
      .limit(50)
    return (data ?? []).map((bv) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dm = Array.isArray(bv.danh_muc) ? bv.danh_muc[0] : (bv.danh_muc as any)
      return { slug: dm?.slug ?? 'ban-ve', 'ban-ve': bv.slug as string }
    })
  } catch {
    return []
  }
}

const DETAIL_SELECT = `
  id, ma_gxn, tieu_de, slug,
  loai_ct, phong_cach_1, phong_cach_2,
  chieu_dai, chieu_rong, so_tang, dien_tich_san, so_phong_ngu,
  tinh_id, mo_ta, the_tag,
  anh_bia, anh_phu,
  goi_tai, seo_title, seo_description,
  luot_xem, luot_tai,
  trang_thai,
  danh_muc:danh_muc_ban_ve(ten, slug)
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function danhMucOf(bv: any): { ten: string; slug: string } | null {
  const raw = bv?.danh_muc
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
}

// Tra cứu theo slug (ưu tiên) rồi ma_gxn. cache() → dedupe giữa
// generateMetadata và page trong cùng 1 request (task 3.5)
const getDrawingByIdentifier = cache(async (identifier: string) => {
  const supabase = createPublicClient()

  const bySlug = await supabase.from('ban_ve').select(DETAIL_SELECT)
    .eq('slug', identifier).eq('trang_thai', 'da_xuat').maybeSingle()
  if (bySlug.data) return { data: bySlug.data, matchedBy: 'slug' as const }

  const byGxn = await supabase.from('ban_ve').select(DETAIL_SELECT)
    .eq('ma_gxn', identifier).eq('trang_thai', 'da_xuat').maybeSingle()
  if (byGxn.data) return { data: byGxn.data, matchedBy: 'ma_gxn' as const }

  return { data: null, matchedBy: null }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data } = await getDrawingByIdentifier(params['ban-ve'])
  if (!data) return { title: 'Bản vẽ không tìm thấy' }

  const dm = danhMucOf(data)
  const canonical = `${BASE_URL}/thu-vien-ban-ve/${dm?.slug ?? params.slug}/${data.slug}`
  const desc = data.seo_description
    ?? (data.mo_ta
        ? String(data.mo_ta).replace(/\s+/g, ' ').slice(0, 158)
        : `Tải bản vẽ ${data.tieu_de} — hồ sơ PDF, khái toán chi phí tại GiaXayNha.vn`)

  return {
    title: data.seo_title ?? `${data.tieu_de} — GiaXayNha.vn`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: data.seo_title ?? data.tieu_de,
      description: desc,
      url: canonical,
      images: data.anh_bia ? [{ url: data.anh_bia }] : undefined,
    },
  }
}

async function getRelated(loaiCt: number, excludeId: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('ban_ve')
    .select(`
      id, ma_gxn, tieu_de, slug, loai_ct, phong_cach_1, goi_tai,
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
  const { data: bv, matchedBy } = await getDrawingByIdentifier(params['ban-ve'])

  if (!bv) notFound()

  const danh_muc = danhMucOf(bv)

  // 301 redirect URL cũ (ma_gxn) → URL slug chuẩn (task 2.7)
  if (matchedBy === 'ma_gxn') {
    permanentRedirect(`/thu-vien-ban-ve/${danh_muc?.slug ?? params.slug}/${bv.slug}`)
  }

  const loai   = LOAI_CT[bv.loai_ct]
  const phong1 = PHONG_CACH[bv.phong_cach_1]
  const phong2 = bv.phong_cach_2 ? PHONG_CACH[bv.phong_cach_2] : null
  const tinh   = bv.tinh_id ? TINH[bv.tinh_id] : null

  const related = await getRelated(bv.loai_ct, bv.id)

  const allImages = [bv.anh_bia, ...(bv.anh_phu ?? [])].filter(Boolean) as string[]
  const canonicalPath = `/thu-vien-ban-ve/${danh_muc?.slug ?? params.slug}/${bv.slug}`

  // JSON-LD: Product + BreadcrumbList (task 2.5)
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: bv.tieu_de,
    image: allImages.length ? allImages : undefined,
    description: bv.mo_ta ?? bv.tieu_de,
    sku: bv.ma_gxn,
    category: loai?.ten,
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      price: bv.goi_tai === 'free' ? '0' : undefined,
      priceCurrency: 'VND',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}${canonicalPath}`,
    },
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Thư viện bản vẽ', item: `${BASE_URL}/thu-vien-ban-ve` },
      ...(danh_muc ? [{ '@type': 'ListItem', position: 2, name: danh_muc.ten, item: `${BASE_URL}/thu-vien-ban-ve/${danh_muc.slug}` }] : []),
      { '@type': 'ListItem', position: danh_muc ? 3 : 2, name: bv.tieu_de, item: `${BASE_URL}${canonicalPath}` },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <ViewBeacon banVeId={bv.id} />
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />

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
            <Gallery images={allImages} alt={bv.tieu_de} fallbackEmoji={loai?.emoji ?? '🏠'} />

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
                Link tải có hiệu lực {DOWNLOAD.expireHours} giờ sau khi nhận
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
                  slug={r.slug}
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
