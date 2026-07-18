// ============================================================
// TYPES — GiaXayNha.vn
// Sinh từ schema DB Phase 1
// ============================================================

// ── Enum helpers ─────────────────────────────────────────────

export type TrangThaiBanVe = 'nhap' | 'cho_duyet' | 'da_xuat' | 'an'
export type GoiTai = 'free' | 'basic'
export type NhuCauLead = 'tham_khao' | 'muon_thicong' | 'can_tuvan' | 'khac'
export type TrangThaiGoiDien = 'cho_goi' | 'dang_tuvan' | 'da_chot' | 'khong_dt'
export type RoleCMS = 'bien_tap' | 'quan_ly'

// ── Danh mục ─────────────────────────────────────────────────

export interface DanhMucBanVe {
  id: string
  ten: string
  slug: string
  cha_id: string | null
  thu_tu: number
  mo_ta: string | null
  anh_dai_dien: string | null
}

// ── Bản vẽ ───────────────────────────────────────────────────

export interface BanVe {
  id: string
  ma_gxn: string                 // GXN_11_1313_311023
  tieu_de: string
  slug: string
  danh_muc_id: string
  loai_ct: number                // 1–9
  phong_cach_1: number           // 1–18
  phong_cach_2: number | null
  chieu_dai: number | null
  chieu_rong: number | null
  so_tang: number | null
  dien_tich_san: number | null
  so_phong_ngu: number | null
  tinh_id: number | null         // 1–63
  mo_ta: string | null
  the_tag: string[]
  anh_bia: string | null
  anh_phu: string[]
  file_pdf_url: string | null
  file_cad_url: string | null
  goi_tai: GoiTai
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[]
  trang_thai: TrangThaiBanVe
  nguoi_tao_id: string
  luot_xem: number
  luot_tai: number
  created_at: string
  updated_at: string
  // Joined
  danh_muc?: DanhMucBanVe
}

// ── Lead ─────────────────────────────────────────────────────

export interface LeadBanVe {
  id: string
  ban_ve_id: string
  ho_ten: string | null
  so_dien_thoai: string
  email: string | null
  tinh_id: number | null
  nhu_cau: NhuCauLead | null
  ghi_chu: string | null
  trang_thai_gd: TrangThaiGoiDien
  ghi_chu_crm: string | null
  created_at: string
  // Joined
  ban_ve?: Pick<BanVe, 'id' | 'tieu_de' | 'ma_gxn' | 'anh_bia'>
}

// ── API Request/Response shapes ───────────────────────────────

export interface EstimatePayload {
  khai_toan_min: number
  khai_toan_max: number
  muc_hoan_thien: string
  dt_lo_dat: number
}

export interface SubmitLeadRequest {
  ban_ve_id: string
  ho_ten?: string
  so_dien_thoai: string
  tinh_id?: number
  nhu_cau?: NhuCauLead
  // Tham số khái toán (khi gửi từ widget dự toán)
  khai_toan_min?: number
  khai_toan_max?: number
  muc_hoan_thien?: string
  dt_lo_dat?: number
}

export interface SubmitLeadResponse {
  success: boolean
  download_url?: string   // /api/download/[token] — không lộ URL thật
  expires_at?: string     // ISO string, hết hạn sau 24h
  error?: string
}

// ── Download token (internal) ─────────────────────────────────

export interface DownloadToken {
  id: string
  token: string
  ban_ve_id: string
  lead_id: string
  phone_hash: string
  expires_at: string
  use_count: number
  max_uses: number
  created_at: string
}

// ── CMS filter params ─────────────────────────────────────────

export interface BanVeFilterParams {
  slug?: string           // danh mục slug
  phong_cach?: number[]
  so_tang?: number
  dien_tich_min?: number
  dien_tich_max?: number
  tinh_id?: number
  goi_tai?: GoiTai
  q?: string              // full-text search
  sort?: 'moi_nhat' | 'xem_nhieu' | 'tai_nhieu'
  page?: number
  limit?: number
}
