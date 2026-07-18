import Link from 'next/link'
import Image from 'next/image'
import { LOAI_CT, PHONG_CACH } from '@/lib/constants'

export interface DrawingCardProps {
  maGXN: string
  slug?: string
  tieuDe: string
  loaiCt: number
  phongCach1: number
  goiTai: 'free' | 'basic'
  anhBia: string | null
  luotTai: number
  danhMucSlug: string
}

export function DrawingCard({
  maGXN,
  slug,
  tieuDe,
  loaiCt,
  phongCach1,
  goiTai,
  anhBia,
  luotTai,
  danhMucSlug,
}: DrawingCardProps) {
  const loai   = LOAI_CT[loaiCt]
  const phong  = PHONG_CACH[phongCach1]
  // URL ưu tiên slug (SEO); fallback ma_gxn nếu thiếu slug
  const href   = `/thu-vien-ban-ve/${danhMucSlug}/${slug || maGXN}`

  return (
    <Link href={href} className="drawing-card group block">
      {/* Thumbnail */}
      <div className="drawing-card-img">
        {anhBia ? (
          <Image
            src={anhBia}
            alt={tieuDe}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-zinc-100 flex flex-col items-center justify-center gap-1">
            <span className="text-4xl opacity-40">{loai?.emoji ?? '🏠'}</span>
            <span className="text-xs text-zinc-400 font-medium">{loai?.ten}</span>
          </div>
        )}

        {/* Mã GXN — góc trên trái */}
        <div className="absolute top-2 left-2 bg-zinc-900/80 backdrop-blur-sm
                        text-zinc-200 text-[10px] font-mono px-1.5 py-0.5 rounded">
          {maGXN}
        </div>

        {/* Gói tải badge — góc trên phải */}
        <div className="absolute top-2 right-2">
          {goiTai === 'free'
            ? <span className="badge-free text-[10px]">FREE</span>
            : <span className="badge-basic text-[10px]">CƠ BẢN</span>
          }
        </div>
      </div>

      {/* Nội dung */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-zinc-800 line-clamp-2 leading-snug mb-1.5
                       group-hover:text-blue-600 transition-colors">
          {tieuDe}
        </h3>
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500 truncate max-w-[70%]">
            {loai?.ten}
            {phong ? ` · ${phong.ten}` : ''}
          </div>
          {/* Lượt tải */}
          <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
            <svg width="11" height="11" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            {luotTai.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    </Link>
  )
}
