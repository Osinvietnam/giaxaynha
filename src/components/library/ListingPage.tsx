import Link from 'next/link'
import { DrawingCard } from './DrawingCard'

interface ListingPageProps {
  title: string
  subtitle: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
}

// Trang liệt kê bản vẽ dùng chung (landing phong cách / tỉnh)
export function ListingPage({ title, subtitle, data }: ListingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-zinc-900 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-zinc-500 mb-2">
            <Link href="/thu-vien-ban-ve" className="hover:text-zinc-300">Thư viện bản vẽ</Link>
          </nav>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {data.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-300 rounded-xl">
            <div className="text-4xl mb-3">📐</div>
            <p className="text-zinc-600 font-medium mb-1">Chưa có bản vẽ</p>
            <p className="text-sm text-zinc-400 mb-4">Nội dung đang được cập nhật.</p>
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

// Cột select chuẩn cho thẻ bản vẽ
export const CARD_SELECT = `
  id, ma_gxn, slug, tieu_de, loai_ct, phong_cach_1, goi_tai,
  anh_bia, luot_tai, danh_muc:danh_muc_ban_ve(slug)
`
