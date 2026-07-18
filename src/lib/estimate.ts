// ============================================================
// Khái toán chi phí xây dựng — công thức DIỆN TÍCH XÂY DỰNG QUY ĐỔI
// (Đợt 5). Giá trị khớp bảng suat_dau_tu / he_so_quy_doi trong DB.
// ⚠️ Đơn giá tham chiếu 2025 — cập nhật theo khảo sát thực tế.
// ============================================================

export type CapHoanThien = 'tho' | 'co_ban' | 'kha' | 'cao_cap'
export type LoaiMai = 'ton' | 'bang' | 'thai'

// Suất đầu tư (VND/m² quy đổi)
export const DON_GIA: Record<CapHoanThien, { label: string; min: number; max: number }> = {
  tho:     { label: 'Xây thô + nhân công HT', min: 3_500_000, max: 3_900_000 },
  co_ban:  { label: 'Trọn gói cơ bản',        min: 5_500_000, max: 6_500_000 },
  kha:     { label: 'Trọn gói khá',           min: 7_000_000, max: 8_500_000 },
  cao_cap: { label: 'Cao cấp / biệt thự',     min: 9_000_000, max: 15_000_000 },
}

// Hệ số quy đổi diện tích theo hạng mục
const HE_SO = {
  mong: 0.5,
  ham: 1.75,
  san: 1.0,
  mai: { ton: 0.3, bang: 0.5, thai: 0.9 } as Record<LoaiMai, number>,
  tum: 0.6 * 0.3, // tum nhỏ (ước lượng)
}

export const MAI_LABEL: Record<LoaiMai, string> = {
  ton: 'Mái tôn', bang: 'Mái bằng (BTCT)', thai: 'Mái thái / ngói',
}

// Hệ số vùng theo tỉnh (HN/HCM +10%, ĐN/HP +5%)
export function heSoVung(tinhId: number | null): number {
  if (tinhId === 1 || tinhId === 2) return 1.1
  if (tinhId === 3 || tinhId === 4) return 1.05
  return 1.0
}

export interface KhaiToanInput {
  dt1San: number          // diện tích 1 sàn (m²)
  soTang: number
  loaiMai: LoaiMai
  coHam: boolean
  capHoanThien: CapHoanThien
  tinhId: number | null
}

/** Diện tích xây dựng quy đổi (m²) */
export function tinhDTXD(i: KhaiToanInput): number {
  const mong = i.dt1San * HE_SO.mong
  const ham  = i.coHam ? i.dt1San * HE_SO.ham : 0
  const san  = i.dt1San * Math.max(1, i.soTang) * HE_SO.san
  const mai  = i.dt1San * HE_SO.mai[i.loaiMai]
  const tum  = i.dt1San * HE_SO.tum
  return mong + ham + san + mai + tum
}

/** Khái toán chi phí (khoảng min–max VND) */
export function tinhKhaiToan(i: KhaiToanInput): { dtxd: number; min: number; max: number } {
  const dtxd = tinhDTXD(i)
  const dg   = DON_GIA[i.capHoanThien]
  const vung = heSoVung(i.tinhId)
  return {
    dtxd: Math.round(dtxd),
    min: Math.round(dtxd * dg.min * vung),
    max: Math.round(dtxd * dg.max * vung),
  }
}

/** Định dạng tiền Việt gọn: 1.85 tỷ / 950 triệu */
export function formatVND(n: number): string {
  if (n >= 1_000_000_000) {
    const ty = n / 1_000_000_000
    return `${ty.toFixed(ty >= 10 ? 1 : 2).replace(/\.?0+$/, '')} tỷ`
  }
  return `${Math.round(n / 1_000_000)} triệu`
}
