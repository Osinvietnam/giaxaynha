import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { BASE_URL, boDauTiengViet } from '@/lib/site'
import { LOAI_CT, PHONG_CACH, TINH } from '@/lib/constants'

export const revalidate = 3600 // làm mới sitemap mỗi giờ

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/thu-vien-ban-ve`, lastModified: now, changeFrequency: 'daily',   priority: 1 },
    { url: `${BASE_URL}/bang-gia`,        lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const categoryPages: MetadataRoute.Sitemap = Object.values(LOAI_CT).map(l => ({
    url: `${BASE_URL}/thu-vien-ban-ve/${l.slug}`,
    lastModified: now, changeFrequency: 'weekly', priority: 0.8,
  }))

  const phongCachPages: MetadataRoute.Sitemap = Object.values(PHONG_CACH).map(pc => ({
    url: `${BASE_URL}/phong-cach/${pc.slug}`,
    lastModified: now, changeFrequency: 'weekly', priority: 0.6,
  }))

  const tinhSlug = (ten: string) =>
    boDauTiengViet(ten).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const tinhPages: MetadataRoute.Sitemap = Object.values(TINH).map(ten => ({
    url: `${BASE_URL}/tinh/${tinhSlug(ten)}`,
    lastModified: now, changeFrequency: 'weekly', priority: 0.6,
  }))

  let drawingPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('ban_ve')
      .select('slug, updated_at, danh_muc:danh_muc_ban_ve(slug)')
      .eq('trang_thai', 'da_xuat')
      .order('updated_at', { ascending: false })
      .limit(5000)

    drawingPages = (data ?? []).map((bv) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dm = Array.isArray(bv.danh_muc) ? bv.danh_muc[0] : (bv.danh_muc as any)
      return {
        url: `${BASE_URL}/thu-vien-ban-ve/${dm?.slug ?? 'ban-ve'}/${bv.slug}`,
        lastModified: bv.updated_at ? new Date(bv.updated_at) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }
    })
  } catch {
    // Nếu DB lỗi, vẫn trả sitemap tĩnh + danh mục
  }

  return [...staticPages, ...categoryPages, ...phongCachPages, ...tinhPages, ...drawingPages]
}
