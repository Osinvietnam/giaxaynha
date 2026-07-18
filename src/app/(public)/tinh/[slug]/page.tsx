import { createPublicClient } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { TINH } from '@/lib/constants'
import { BASE_URL, boDauTiengViet } from '@/lib/site'
import { ListingPage, CARD_SELECT } from '@/components/library/ListingPage'

export const revalidate = 3600

// Slug tỉnh — sinh giống hệt cột tinh.slug trong DB (f_unaccent + gạch nối)
function tinhSlug(ten: string): string {
  return boDauTiengViet(ten).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const TINH_BY_SLUG: Record<string, number> = Object.fromEntries(
  Object.entries(TINH).map(([k, ten]) => [tinhSlug(ten), Number(k)])
)

export function generateStaticParams() {
  return Object.values(TINH).map(ten => ({ slug: tinhSlug(ten) }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const id = TINH_BY_SLUG[params.slug]
  if (!id) return { title: 'Không tìm thấy' }
  const ten = TINH[id]
  return {
    title: `Bản vẽ nhà đẹp tại ${ten} — GiaXayNha.vn`,
    description: `Mẫu bản vẽ thiết kế nhà ở, biệt thự, nhà phố phù hợp khu vực ${ten}. Tải miễn phí hồ sơ PDF + khái toán tại GiaXayNha.vn.`,
    alternates: { canonical: `${BASE_URL}/tinh/${params.slug}` },
  }
}

export default async function TinhPage({ params }: { params: { slug: string } }) {
  const id = TINH_BY_SLUG[params.slug]
  if (!id) notFound()
  const ten = TINH[id]

  const supabase = createPublicClient()
  const { data, count } = await supabase
    .from('ban_ve')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('trang_thai', 'da_xuat')
    .eq('tinh_id', id)
    .order('luot_tai', { ascending: false })
    .limit(48)

  return (
    <ListingPage
      title={`Bản vẽ nhà đẹp tại ${ten}`}
      subtitle={`${count ?? 0} bản vẽ phù hợp khu vực ${ten}`}
      data={data ?? []}
    />
  )
}
