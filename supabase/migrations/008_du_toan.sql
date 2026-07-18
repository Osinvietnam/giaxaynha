-- ============================================================
-- Migration 008: Dự toán Online (Đợt 5)
-- 1. Trường nghiệp vụ trên ban_ve (phục vụ khái toán)
-- 2. Bảng suất đầu tư + hệ số quy đổi + hệ số vùng (nguồn cho CMS chỉnh sau)
-- 3. Cột lead lưu tham số khái toán khách nhập
-- Idempotent.
-- ============================================================

-- ── 1. Trường nghiệp vụ trên ban_ve (task 5.2) ───────────────
ALTER TABLE ban_ve
  ADD COLUMN IF NOT EXISTS loai_ket_cau   varchar(20),
  ADD COLUMN IF NOT EXISTS loai_mong      varchar(20),
  ADD COLUMN IF NOT EXISTS loai_mai       varchar(20),
  ADD COLUMN IF NOT EXISTS co_tang_ham    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dt_1_san       decimal(8,2),
  ADD COLUMN IF NOT EXISTS dt_khuon_vien  decimal(8,2),
  ADD COLUMN IF NOT EXISTS so_wc          smallint,
  ADD COLUMN IF NOT EXISTS muc_hoan_thien varchar(20);

-- anon (widget khái toán) cần đọc các trường này để prefill
GRANT SELECT (loai_ket_cau, loai_mong, loai_mai, co_tang_ham,
              dt_1_san, dt_khuon_vien, so_wc, muc_hoan_thien)
  ON ban_ve TO anon;

-- ── 2. Bảng suất đầu tư (VND/m² quy đổi) theo cấp hoàn thiện ──
CREATE TABLE IF NOT EXISTS suat_dau_tu (
  id             smallint PRIMARY KEY,
  cap_hoan_thien varchar(20) NOT NULL UNIQUE,
  ten            varchar(80) NOT NULL,
  don_gia_min    bigint NOT NULL,
  don_gia_max    bigint NOT NULL,
  hieu_luc_tu    date DEFAULT current_date,
  ghi_chu        text
);
INSERT INTO suat_dau_tu (id, cap_hoan_thien, ten, don_gia_min, don_gia_max) VALUES
  (1,'tho',    'Xây thô + nhân công hoàn thiện', 3500000, 3900000),
  (2,'co_ban', 'Trọn gói hoàn thiện cơ bản',     5500000, 6500000),
  (3,'kha',    'Trọn gói khá',                   7000000, 8500000),
  (4,'cao_cap','Cao cấp / biệt thự',             9000000, 15000000)
ON CONFLICT (id) DO NOTHING;

-- Hệ số quy đổi diện tích theo hạng mục
CREATE TABLE IF NOT EXISTS he_so_quy_doi (
  hang_muc varchar(30) PRIMARY KEY,
  he_so    numeric(4,2) NOT NULL,
  ghi_chu  text
);
INSERT INTO he_so_quy_doi (hang_muc, he_so, ghi_chu) VALUES
  ('mong',      0.50, 'Móng (trung bình)'),
  ('ham',       1.75, 'Tầng hầm'),
  ('san',       1.00, 'Sàn xây dựng'),
  ('mai_ton',   0.30, 'Mái tôn'),
  ('mai_bang',  0.50, 'Mái bằng BTCT'),
  ('mai_thai',  0.90, 'Mái thái/ngói'),
  ('san_vuon',  0.50, 'Sân vườn'),
  ('tum',       0.60, 'Tum thang')
ON CONFLICT (hang_muc) DO NOTHING;

-- Hệ số vùng theo tỉnh (chỉ lưu tỉnh khác 1.0)
CREATE TABLE IF NOT EXISTS he_so_vung (
  tinh_id smallint PRIMARY KEY REFERENCES tinh(id),
  he_so   numeric(4,2) NOT NULL DEFAULT 1.0
);
INSERT INTO he_so_vung (tinh_id, he_so) VALUES
  (1,1.10),(2,1.10),(3,1.05),(4,1.05)
ON CONFLICT (tinh_id) DO NOTHING;

GRANT SELECT ON suat_dau_tu, he_so_quy_doi, he_so_vung TO anon, authenticated;

-- ── 3. Cột lead lưu tham số khái toán khách nhập (task 5.5) ──
ALTER TABLE lead_ban_ve
  ADD COLUMN IF NOT EXISTS dt_lo_dat      decimal(8,2),
  ADD COLUMN IF NOT EXISTS muc_hoan_thien varchar(20),
  ADD COLUMN IF NOT EXISTS khai_toan_min  bigint,
  ADD COLUMN IF NOT EXISTS khai_toan_max  bigint;

-- ============================================================
-- ROLLBACK: ALTER TABLE ban_ve DROP COLUMN loai_ket_cau ...;
--   DROP TABLE suat_dau_tu, he_so_quy_doi, he_so_vung;
--   ALTER TABLE lead_ban_ve DROP COLUMN dt_lo_dat ...;
-- ============================================================
