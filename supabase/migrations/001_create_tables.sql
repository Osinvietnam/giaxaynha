-- ============================================================
-- Migration 001: Tạo bảng Phase 1
-- GiaXayNha.vn — Thư viện bản vẽ
-- Chạy trong Supabase Dashboard → SQL Editor
-- ============================================================

-- Extension full-text search tiếng Việt
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── 1. Bảng danh mục bản vẽ (phân cấp) ──────────────────────

CREATE TABLE IF NOT EXISTS danh_muc_ban_ve (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten           VARCHAR(100)  NOT NULL,
  slug          VARCHAR(100)  NOT NULL UNIQUE,
  cha_id        UUID          REFERENCES danh_muc_ban_ve(id) ON DELETE SET NULL,
  thu_tu        INT           DEFAULT 0,
  mo_ta         TEXT,
  anh_dai_dien  TEXT,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_danh_muc_slug    ON danh_muc_ban_ve(slug);
CREATE INDEX idx_danh_muc_cha_id  ON danh_muc_ban_ve(cha_id);

-- ── 2. Bảng bản vẽ (core table) ──────────────────────────────

CREATE TABLE IF NOT EXISTS ban_ve (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_gxn          VARCHAR(30) NOT NULL UNIQUE,  -- GXN_11_1313_311023
  tieu_de         VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL UNIQUE,
  danh_muc_id     UUID        REFERENCES danh_muc_ban_ve(id) ON DELETE SET NULL,

  -- Phân loại theo chuẩn GXN
  loai_ct         SMALLINT    NOT NULL CHECK (loai_ct BETWEEN 1 AND 9),
  phong_cach_1    SMALLINT    NOT NULL CHECK (phong_cach_1 BETWEEN 1 AND 18),
  phong_cach_2    SMALLINT    CHECK (phong_cach_2 BETWEEN 1 AND 18),

  -- Thông số kỹ thuật
  chieu_dai       DECIMAL(6,2),
  chieu_rong      DECIMAL(6,2),
  so_tang         SMALLINT,
  dien_tich_san   DECIMAL(8,2),
  so_phong_ngu    SMALLINT,
  tinh_id         SMALLINT    CHECK (tinh_id BETWEEN 1 AND 63),

  -- Nội dung
  mo_ta           TEXT,
  the_tag         TEXT[]      DEFAULT '{}',

  -- Files
  anh_bia         TEXT,                          -- Supabase Storage URL
  anh_phu         TEXT[]      DEFAULT '{}',      -- Supabase Storage URLs
  file_pdf_url    TEXT,                          -- Google Drive URL
  file_cad_url    TEXT,                          -- Google Drive URL (Cơ bản+)

  -- Gói tải
  goi_tai         VARCHAR(10) NOT NULL DEFAULT 'free'
                    CHECK (goi_tai IN ('free', 'basic')),

  -- SEO
  seo_title       VARCHAR(70),
  seo_description VARCHAR(160),
  seo_keywords    TEXT[]      DEFAULT '{}',

  -- Workflow
  trang_thai      VARCHAR(15) NOT NULL DEFAULT 'nhap'
                    CHECK (trang_thai IN ('nhap', 'cho_duyet', 'da_xuat', 'an')),
  nguoi_tao_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Stats
  luot_xem        INT         NOT NULL DEFAULT 0,
  luot_tai        INT         NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho search + filter
CREATE INDEX idx_ban_ve_slug        ON ban_ve(slug);
CREATE INDEX idx_ban_ve_trang_thai  ON ban_ve(trang_thai);
CREATE INDEX idx_ban_ve_loai_ct     ON ban_ve(loai_ct);
CREATE INDEX idx_ban_ve_phong_cach  ON ban_ve(phong_cach_1);
CREATE INDEX idx_ban_ve_tinh        ON ban_ve(tinh_id);
CREATE INDEX idx_ban_ve_goi_tai     ON ban_ve(goi_tai);
CREATE INDEX idx_ban_ve_created     ON ban_ve(created_at DESC);
CREATE INDEX idx_ban_ve_luot_tai    ON ban_ve(luot_tai DESC);
CREATE INDEX idx_ban_ve_luot_xem    ON ban_ve(luot_xem DESC);

-- Full-text search với pg_trgm (hỗ trợ tiếng Việt)
CREATE INDEX idx_ban_ve_trgm_tieu_de ON ban_ve USING gin (tieu_de gin_trgm_ops);
CREATE INDEX idx_ban_ve_trgm_mo_ta   ON ban_ve USING gin (mo_ta   gin_trgm_ops);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ban_ve_updated_at
  BEFORE UPDATE ON ban_ve
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. Bảng lead từ download gate ────────────────────────────

CREATE TABLE IF NOT EXISTS lead_ban_ve (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ban_ve_id       UUID        NOT NULL REFERENCES ban_ve(id) ON DELETE CASCADE,

  -- Thông tin liên hệ
  ho_ten          VARCHAR(100),
  so_dien_thoai   VARCHAR(15) NOT NULL,
  email           VARCHAR(100),
  tinh_id         SMALLINT    CHECK (tinh_id BETWEEN 1 AND 63),
  nhu_cau         VARCHAR(20) CHECK (nhu_cau IN ('tham_khao','muon_thicong','can_tuvan','khac')),
  ghi_chu         TEXT,

  -- CRM tracking
  trang_thai_gd   VARCHAR(15) NOT NULL DEFAULT 'cho_goi'
                    CHECK (trang_thai_gd IN ('cho_goi','dang_tuvan','da_chot','khong_dt')),
  nguoi_phu_trach UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  ghi_chu_crm     TEXT,

  -- File delivery
  drive_url       TEXT,                          -- Signed URL đã gửi cho user
  url_expires_at  TIMESTAMPTZ,                   -- created_at + 72h

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_ban_ve_id     ON lead_ban_ve(ban_ve_id);
CREATE INDEX idx_lead_sdt           ON lead_ban_ve(so_dien_thoai);
CREATE INDEX idx_lead_created       ON lead_ban_ve(created_at DESC);
CREATE INDEX idx_lead_trang_thai    ON lead_ban_ve(trang_thai_gd);
CREATE INDEX idx_lead_tinh          ON lead_ban_ve(tinh_id);

-- ── 4. RLS Policies ──────────────────────────────────────────

-- Enable RLS
ALTER TABLE danh_muc_ban_ve ENABLE ROW LEVEL SECURITY;
ALTER TABLE ban_ve           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_ban_ve      ENABLE ROW LEVEL SECURITY;

-- Bảng danh mục: ai cũng đọc được
CREATE POLICY "Public read danh_muc"
  ON danh_muc_ban_ve FOR SELECT USING (true);

CREATE POLICY "Quan_ly write danh_muc"
  ON danh_muc_ban_ve FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'quan_ly'
    )
  );

-- Bảng ban_ve:
-- SELECT: public chỉ thấy da_xuat; CMS thấy tất cả theo role
CREATE POLICY "Public select da_xuat"
  ON ban_ve FOR SELECT
  USING (
    trang_thai = 'da_xuat'
    OR auth.uid() IS NOT NULL  -- CMS user thấy tất cả
  );

CREATE POLICY "Bien_tap insert own"
  ON ban_ve FOR INSERT
  WITH CHECK (
    auth.uid() = nguoi_tao_id
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('bien_tap', 'quan_ly')
    )
  );

CREATE POLICY "Bien_tap update own"
  ON ban_ve FOR UPDATE
  USING (
    nguoi_tao_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'quan_ly'
    )
  );

CREATE POLICY "Quan_ly delete"
  ON ban_ve FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'quan_ly'
    )
  );

-- Bảng lead: public INSERT (anonymous), chỉ CMS mới SELECT
CREATE POLICY "Anyone insert lead"
  ON lead_ban_ve FOR INSERT WITH CHECK (true);

CREATE POLICY "CMS read leads"
  ON lead_ban_ve FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "CMS update lead status"
  ON lead_ban_ve FOR UPDATE
  USING (auth.uid() IS NOT NULL);
