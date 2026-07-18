import { createPublicClient } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PHONG_CACH } from '@/lib/constants'
import { BASE_URL } from '@/lib/site'
import { ListingPage, CARD_SELECT } from '@/components/library/ListingPage'

export const revalidate = 3600

const PC_BY_SLUG: Record<string, number> = Object.fromEntries(
  Object.entries(PHONG_CACH).map(([k, v]) => [v.slug, Number(k)])
)

export function generateStaticParams() {
  return Object.values(PHONG_CACH).map(v => ({ slug: v.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const id = PC_BY_SLUG[params.slug]
  if (!id) return { title: 'Không tìm thấy' }
  const pc = PHONG_CACH[id]
  return {
    title: `Bản vẽ phong cách ${pc.ten} — GiaXayNha.vn`,
    description: `Tổng hợp bản vẽ thiết kế phong cách ${pc.ten}: mặt bằng, phối cảnh, dự toán chi tiết. Tải miễn phí tại GiaXayNha.vn.`,
    alternates: { canonical: `${BASE_URL}/phong-cach/${pc.slug}` },
  }
}

export default async function PhongCachPage({ params }: { params: { slug: string } }) {
  const id = PC_BY_SLUG[params.slug]
  if (!id) notFound()
  const pc = PHONG_CACH[id]

  const supabase = createPublicClient()
  const { data, count } = await supabase
    .from('ban_ve')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('trang_thai', 'da_xuat')
    .eq('phong_cach_1', id)
    .order('luot_tai', { ascending: false })
    .limit(48)

  return (
    <ListingPage
      title={`Bản vẽ phong cách ${pc.ten}`}
      subtitle={`${count ?? 0} bản vẽ thiết kế phong cách ${pc.ten}`}
      data={data ?? []}
    />
  )
}
