-- ============================================================
-- Migration 007: Dữ liệu & mở rộng (Đợt 4)
-- 1. Bảng phong_cach + tinh (kèm SEO) cho landing page
-- 2. Trigger đồng bộ danh_muc_id từ loai_ct (1 nguồn sự thật)
-- 3. Index tối ưu (composite partial) + bỏ index trùng
-- 4. Dọn field chết + mở goi_tai tier 3
-- 5. RPC đếm bản vẽ theo loại (thay .length)
-- Idempotent — chạy lại an toàn.
-- ============================================================

-- ── 1. Bảng phong_cach (SEO landing) ─────────────────────────
CREATE TABLE IF NOT EXISTS phong_cach (
  id        smallint    PRIMARY KEY,
  ten       varchar(50) NOT NULL,
  slug      varchar(50) NOT NULL UNIQUE,
  seo_title varchar(70),
  mo_ta     text
);

INSERT INTO phong_cach (id, ten, slug) VALUES
  (1,'Cổ điển','co-dien'),(2,'Tân cổ điển','tan-co-dien'),(3,'Hiện đại','hien-dai'),
  (4,'Song lập','song-lap'),(5,'Đơn lập','don-lap'),(6,'Lâu đài','lau-dai'),
  (7,'Truyền thống','truyen-thong'),(8,'Homestay','homestay'),(9,'Shophouse','shophouse'),
  (10,'Liền kề','lien-ke'),(11,'TM dịch vụ','tm-dich-vu'),(12,'Chung cư mini','chung-cu-mini'),
  (13,'Đa dụng','da-dung'),(14,'Tứ lập','tu-lap'),(15,'Nhà vườn','nha-vuon'),
  (16,'Compound','compound'),(17,'Nghỉ dưỡng','nghi-duong'),(18,'Tối giản','toi-gian')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Bảng tinh (slug tự sinh bằng f_unaccent từ 006) ───────
CREATE TABLE IF NOT EXISTS tinh (
  id        smallint    PRIMARY KEY,
  ten       varchar(50) NOT NULL,
  slug      varchar(50) NOT NULL UNIQUE,
  seo_title varchar(70),
  mo_ta     text
);

INSERT INTO tinh (id, ten, slug)
SELECT v.id, v.ten,
  regexp_replace(regexp_replace(f_unaccent(v.ten), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
FROM (VALUES
  (1,'Hà Nội'),(2,'TP. Hồ Chí Minh'),(3,'Đà Nẵng'),(4,'Hải Phòng'),(5,'Cần Thơ'),
  (6,'An Giang'),(7,'Bà Rịa - Vũng Tàu'),(8,'Bắc Giang'),(9,'Bắc Kạn'),(10,'Bạc Liêu'),
  (11,'Bắc Ninh'),(12,'Bến Tre'),(13,'Bình Định'),(14,'Bình Dương'),(15,'Bình Phước'),
  (16,'Bình Thuận'),(17,'Cà Mau'),(18,'Cao Bằng'),(19,'Đắk Lắk'),(20,'Đắk Nông'),
  (21,'Điện Biên'),(22,'Đồng Nai'),(23,'Đồng Tháp'),(24,'Gia Lai'),(25,'Hà Giang'),
  (26,'Hà Nam'),(27,'Hà Tĩnh'),(28,'Hải Dương'),(29,'Hậu Giang'),(30,'Hòa Bình'),
  (31,'Hưng Yên'),(32,'Khánh Hòa'),(33,'Kiên Giang'),(34,'Kon Tum'),(35,'Lai Châu'),
  (36,'Lâm Đồng'),(37,'Lạng Sơn'),(38,'Lào Cai'),(39,'Long An'),(40,'Nam Định'),
  (41,'Nghệ An'),(42,'Ninh Bình'),(43,'Ninh Thuận'),(44,'Phú Thọ'),(45,'Phú Yên'),
  (46,'Quảng Bình'),(47,'Quảng Nam'),(48,'Quảng Ngãi'),(49,'Quảng Ninh'),(50,'Quảng Trị'),
  (51,'Sóc Trăng'),(52,'Sơn La'),(53,'Tây Ninh'),(54,'Thái Bình'),(55,'Thái Nguyên'),
  (56,'Thanh Hóa'),(57,'Thừa Thiên Huế'),(58,'Tiền Giang'),(59,'Trà Vinh'),(60,'Tuyên Quang'),
  (61,'Vĩnh Long'),(62,'Vĩnh Phúc'),(63,'Yên Bái')
) AS v(id, ten)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON phong_cach, tinh TO anon, authenticated;

-- ── 3. Trigger: danh_muc_id luôn suy ra từ loai_ct (1 nguồn) ──
CREATE OR REPLACE FUNCTION sync_danh_muc_from_loai_ct()
RETURNS TRIGGER AS $$
DECLARE
  v_slug text;
BEGIN
  v_slug := CASE NEW.loai_ct
    WHEN 1 THEN 'biet-thu'   WHEN 2 THEN 'nha-pho'      WHEN 3 THEN 'nha-cap-4'
    WHEN 4 THEN 'van-phong'  WHEN 5 THEN 'benh-vien'    WHEN 6 THEN 'truong-hoc'
    WHEN 7 THEN 'khach-san'  WHEN 8 THEN 'shop-showroom' WHEN 9 THEN 'chung-cu'
  END;
  SELECT id INTO NEW.danh_muc_id FROM danh_muc_ban_ve WHERE slug = v_slug LIMIT 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ban_ve_sync_danh_muc ON ban_ve;
CREATE TRIGGER ban_ve_sync_danh_muc
  BEFORE INSERT OR UPDATE OF loai_ct ON ban_ve
  FOR EACH ROW EXECUTE FUNCTION sync_danh_muc_from_loai_ct();

-- Đồng bộ dữ liệu hiện có
UPDATE ban_ve SET loai_ct = loai_ct;

-- ── 4. Index tối ưu ──────────────────────────────────────────
DROP INDEX IF EXISTS idx_ban_ve_slug;        -- trùng UNIQUE(slug)
DROP INDEX IF EXISTS idx_danh_muc_slug;      -- trùng UNIQUE(slug)
DROP INDEX IF EXISTS idx_ban_ve_loai_ct;     -- thay bằng composite

CREATE INDEX IF NOT EXISTS idx_ban_ve_cat_created
  ON ban_ve (loai_ct, created_at DESC) WHERE trang_thai = 'da_xuat';
CREATE INDEX IF NOT EXISTS idx_ban_ve_cat_tai
  ON ban_ve (loai_ct, luot_tai DESC) WHERE trang_thai = 'da_xuat';
CREATE INDEX IF NOT EXISTS idx_ban_ve_so_tang
  ON ban_ve (so_tang) WHERE trang_thai = 'da_xuat';
CREATE INDEX IF NOT EXISTS idx_ban_ve_dien_tich
  ON ban_ve (dien_tich_san) WHERE trang_thai = 'da_xuat';

-- ── 5. Dọn field chết + mở goi_tai tier 3 (Đợt 5 monetise) ──
ALTER TABLE lead_ban_ve DROP COLUMN IF EXISTS drive_url;
ALTER TABLE lead_ban_ve DROP COLUMN IF EXISTS url_expires_at;

ALTER TABLE ban_ve DROP CONSTRAINT IF EXISTS ban_ve_goi_tai_check;
ALTER TABLE ban_ve ADD  CONSTRAINT ban_ve_goi_tai_check
  CHECK (goi_tai IN ('free', 'basic', 'standard'));

-- ── 6. RPC đếm bản vẽ theo loại (thay việc kéo cả bảng .length) ──
CREATE OR REPLACE FUNCTION count_ban_ve_by_loai()
RETURNS TABLE(loai_ct smallint, so_luong bigint)
LANGUAGE sql STABLE AS $$
  SELECT loai_ct, count(*) FROM ban_ve WHERE trang_thai = 'da_xuat' GROUP BY loai_ct;
$$;
GRANT EXECUTE ON FUNCTION count_ban_ve_by_loai() TO anon, authenticated;

-- ============================================================
-- ROLLBACK: DROP TABLE phong_cach, tinh; DROP TRIGGER ban_ve_sync_danh_muc ...;
--   DROP FUNCTION sync_danh_muc_from_loai_ct, count_ban_ve_by_loai;
-- ============================================================
