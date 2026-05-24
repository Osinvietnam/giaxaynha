-- ============================================================
-- Migration 002: Seed dữ liệu danh mục
-- 9 loại công trình theo chuẩn GXN (slug chính xác)
-- ============================================================

INSERT INTO danh_muc_ban_ve (ten, slug, thu_tu, mo_ta) VALUES
  ('Biệt thự',            'biet-thu',      1, 'Biệt thự đơn lập, song lập, compound, lâu đài'),
  ('Nhà phố',             'nha-pho',       2, 'Nhà phố liền kề, shophouse, nhà ống'),
  ('Nhà cấp 4',           'nha-cap-4',     3, 'Nhà cấp 4 mái thái, mái bằng, nhà vườn'),
  ('Văn phòng / Trụ sở',  'van-phong',     4, 'Trụ sở công ty, văn phòng, toà nhà hành chính'),
  ('Bệnh viện',           'benh-vien',     5, 'Bệnh viện, phòng khám, cơ sở y tế'),
  ('Trường học',          'truong-hoc',    6, 'Trường mầm non, tiểu học, THCS, THPT, đại học'),
  ('Khách sạn',           'khach-san',     7, 'Khách sạn, resort, homestay, nhà nghỉ'),
  ('Shop / Showroom',     'shop-showroom', 8, 'Showroom ô tô, shop thời trang, cửa hàng tiện lợi'),
  ('Chung cư',            'chung-cu',      9, 'Chung cư mini, căn hộ, nhà tập thể')
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- Helper view: Bản vẽ public với thông tin join
-- ============================================================

CREATE OR REPLACE VIEW v_ban_ve_public AS
SELECT
  b.id, b.ma_gxn, b.tieu_de, b.slug,
  b.loai_ct, b.phong_cach_1, b.phong_cach_2,
  b.chieu_dai, b.chieu_rong, b.so_tang, b.dien_tich_san,
  b.so_phong_ngu, b.tinh_id,
  b.the_tag, b.anh_bia,
  b.goi_tai, b.trang_thai,
  b.seo_title, b.seo_description,
  b.luot_xem, b.luot_tai,
  b.created_at,
  d.ten   AS danh_muc_ten,
  d.slug  AS danh_muc_slug
FROM ban_ve b
LEFT JOIN danh_muc_ban_ve d ON d.id = b.danh_muc_id
WHERE b.trang_thai = 'da_xuat';

-- ============================================================
-- Function: Increment lượt xem (tránh race condition)
-- ============================================================

CREATE OR REPLACE FUNCTION increment_luot_xem(ban_ve_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ban_ve SET luot_xem = luot_xem + 1 WHERE id = ban_ve_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Increment lượt tải
-- ============================================================

CREATE OR REPLACE FUNCTION increment_luot_tai(ban_ve_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ban_ve SET luot_tai = luot_tai + 1 WHERE id = ban_ve_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
