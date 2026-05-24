// ============================================================
// CONSTANTS — Bảng tra cứu theo chuẩn GXN
// Nguồn: 231129.GXN.xlsx — Sheet "Kí hiệu"
// ============================================================

// ── 9 Loại công trình ─────────────────────────────────────────

export const LOAI_CT: Record<number, { ten: string; slug: string; emoji: string; soLuong: string }> = {
  1: { ten: 'Biệt thự',         slug: 'biet-thu',      emoji: '🏛️', soLuong: '120+' },
  2: { ten: 'Nhà phố',          slug: 'nha-pho',       emoji: '🏠', soLuong: '68+'  },
  3: { ten: 'Nhà cấp 4',        slug: 'nha-cap-4',     emoji: '🏡', soLuong: '32+'  },
  4: { ten: 'Văn phòng / Trụ sở', slug: 'van-phong',   emoji: '🏢', soLuong: '85+'  },
  5: { ten: 'Bệnh viện',        slug: 'benh-vien',     emoji: '🏥', soLuong: '45+'  },
  6: { ten: 'Trường học',       slug: 'truong-hoc',    emoji: '🏫', soLuong: '18+'  },
  7: { ten: 'Khách sạn',        slug: 'khach-san',     emoji: '🏨', soLuong: '12+'  },
  8: { ten: 'Shop / Showroom',  slug: 'shop-showroom', emoji: '🏪', soLuong: '15+'  },
  9: { ten: 'Chung cư',         slug: 'chung-cu',      emoji: '🏗️', soLuong: '22+'  },
}

// ── 18 Phong cách thiết kế ────────────────────────────────────

export const PHONG_CACH: Record<number, { ten: string; slug: string }> = {
  1:  { ten: 'Cổ điển',      slug: 'co-dien'       },
  2:  { ten: 'Tân cổ điển',  slug: 'tan-co-dien'   },
  3:  { ten: 'Hiện đại',     slug: 'hien-dai'      },
  4:  { ten: 'Song lập',     slug: 'song-lap'      },
  5:  { ten: 'Đơn lập',      slug: 'don-lap'       },
  6:  { ten: 'Lâu đài',      slug: 'lau-dai'       },
  7:  { ten: 'Truyền thống', slug: 'truyen-thong'  },
  8:  { ten: 'Homestay',     slug: 'homestay'      },
  9:  { ten: 'Shophouse',    slug: 'shophouse'     },
  10: { ten: 'Liền kề',      slug: 'lien-ke'       },
  11: { ten: 'TM dịch vụ',   slug: 'tm-dich-vu'    },
  12: { ten: 'Chung cư mini',slug: 'chung-cu-mini' },
  13: { ten: 'Đa dụng',      slug: 'da-dung'       },
  14: { ten: 'Tứ lập',       slug: 'tu-lap'        },
  15: { ten: 'Nhà vườn',     slug: 'nha-vuon'      },
  16: { ten: 'Compound',     slug: 'compound'      },
  17: { ten: 'Nghỉ dưỡng',   slug: 'nghi-duong'    },
  18: { ten: 'Tối giản',     slug: 'toi-gian'      },
}

// ── 3 Gói (package code) ─────────────────────────────────────

export const GOI_CODE: Record<number, { ten: string; mota: string }> = {
  1: { ten: 'Miễn phí',   mota: 'PDF mặt bằng + phối cảnh + khái toán'   },
  2: { ten: 'Cơ bản',     mota: 'Hồ sơ KT+KC+ĐN + dự toán (PDF+Doc)'   },
  3: { ten: 'Tiêu chuẩn', mota: 'Full bộ + CAD + Excel + MSProject'       },
}

// ── 63 Tỉnh/Thành phố ────────────────────────────────────────

export const TINH: Record<number, string> = {
  1:  'Hà Nội',          2:  'TP. Hồ Chí Minh',  3:  'Đà Nẵng',
  4:  'Hải Phòng',       5:  'Cần Thơ',           6:  'An Giang',
  7:  'Bà Rịa - Vũng Tàu', 8: 'Bắc Giang',        9:  'Bắc Kạn',
  10: 'Bạc Liêu',        11: 'Bắc Ninh',          12: 'Bến Tre',
  13: 'Bình Định',       14: 'Bình Dương',         15: 'Bình Phước',
  16: 'Bình Thuận',      17: 'Cà Mau',             18: 'Cao Bằng',
  19: 'Đắk Lắk',         20: 'Đắk Nông',           21: 'Điện Biên',
  22: 'Đồng Nai',        23: 'Đồng Tháp',          24: 'Gia Lai',
  25: 'Hà Giang',        26: 'Hà Nam',              27: 'Hà Tĩnh',
  28: 'Hải Dương',       29: 'Hậu Giang',           30: 'Hòa Bình',
  31: 'Hưng Yên',        32: 'Khánh Hòa',           33: 'Kiên Giang',
  34: 'Kon Tum',         35: 'Lai Châu',             36: 'Lâm Đồng',
  37: 'Lạng Sơn',        38: 'Lào Cai',              39: 'Long An',
  40: 'Nam Định',        41: 'Nghệ An',              42: 'Ninh Bình',
  43: 'Ninh Thuận',      44: 'Phú Thọ',              45: 'Phú Yên',
  46: 'Quảng Bình',      47: 'Quảng Nam',             48: 'Quảng Ngãi',
  49: 'Quảng Ninh',      50: 'Quảng Trị',             51: 'Sóc Trăng',
  52: 'Sơn La',          53: 'Tây Ninh',              54: 'Thái Bình',
  55: 'Thái Nguyên',     56: 'Thanh Hóa',             57: 'Thừa Thiên Huế',
  58: 'Tiền Giang',      59: 'Trà Vinh',              60: 'Tuyên Quang',
  61: 'Vĩnh Long',       62: 'Vĩnh Phúc',             63: 'Yên Bái',
}

// ── Nhu cầu lead ─────────────────────────────────────────────

export const NHU_CAU_LABELS: Record<string, string> = {
  tham_khao:    'Tham khảo thiết kế',
  muon_thicong: 'Muốn thi công',
  can_tuvan:    'Cần tư vấn',
  khac:         'Khác',
}

// ── Sinh mã GXN ──────────────────────────────────────────────
// Format: GXN_[P][L]_[BT][S1][S2]_[DDMMYY]
// VD:     GXN_11_1313_311023

export function sinhMaGXN(params: {
  goiCode: number   // 1–3
  tinhId: number    // 1–63
  loaiCt: number    // 1–9
  phongCach1: number // 1–18
  phongCach2: number // 1–18
  ngay?: Date
}): string {
  const { goiCode, tinhId, loaiCt, phongCach1, phongCach2, ngay = new Date() } = params
  const dd = String(ngay.getDate()).padStart(2, '0')
  const mm = String(ngay.getMonth() + 1).padStart(2, '0')
  const yy = String(ngay.getFullYear()).slice(-2)
  return `GXN_${goiCode}${tinhId}_${loaiCt}${phongCach1}${phongCach2}_${dd}${mm}${yy}`
}

// ── Pagination defaults ───────────────────────────────────────

export const PAGE_SIZE = 12
export const SIGNED_URL_DURATION = 72 * 60 * 60  // 72 giờ = 259200 giây
