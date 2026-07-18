// ============================================================
// Cấu hình site — nguồn DUY NHẤT cho hotline, Zalo, thời hạn link, gói tải.
// ⚠️ THAY SỐ THẬT: đặt biến môi trường NEXT_PUBLIC_HOTLINE và
//    NEXT_PUBLIC_ZALO_URL trên Vercel, hoặc sửa giá trị mặc định bên dưới.
// ============================================================

const hotline = process.env.NEXT_PUBLIC_HOTLINE ?? '0900 000 000' // TODO: thay số thật

export const SITE = {
  hotline,
  hotlineTel: hotline.replace(/[^0-9+]/g, ''),
  zaloUrl: process.env.NEXT_PUBLIC_ZALO_URL ?? 'https://zalo.me/', // TODO: thay link Zalo OA
}

// Thời hạn link tải — PHẢI khớp TOKEN_EXPIRE_HOURS / TOKEN_MAX_USES trong /api/leads
export const DOWNLOAD = {
  expireHours: parseInt(process.env.NEXT_PUBLIC_TOKEN_EXPIRE_HOURS ?? '24', 10),
  maxUses:     parseInt(process.env.NEXT_PUBLIC_TOKEN_MAX_USES ?? '3', 10),
}

// Thông tin gói tải — hiển thị minh bạch trên UI
export const GOI_INFO: Record<'free' | 'basic', { label: string; price: string; desc: string }> = {
  free:  { label: 'FREE',   price: 'Miễn phí',          desc: 'PDF mặt bằng + phối cảnh + khái toán' },
  basic: { label: 'CƠ BẢN', price: 'Liên hệ báo giá',   desc: 'Hồ sơ KT+KC+ĐN + dự toán chi tiết (PDF+Excel)' },
}

/** Bỏ dấu tiếng Việt + lowercase — để so khớp tìm kiếm không dấu (đồng bộ cột search_text) */
export function boDauTiengViet(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim()
}

/** Chuẩn hoá & kiểm tra SĐT Việt Nam (client-side) → trả 0xxxxxxxxx hoặc null */
export function chuanHoaSDT(raw: string): string | null {
  let p = raw.replace(/[\s\-().]/g, '')
  if (p.startsWith('+84'))                        p = '0' + p.slice(3)
  else if (p.startsWith('84') && p.length >= 11)  p = '0' + p.slice(2)
  return /^0\d{9}$/.test(p) ? p : null
}
