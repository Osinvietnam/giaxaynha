-- ============================================================
-- Migration 005: Vá bảo mật (Đợt 0)
-- 1. Chuyển RLS authz sang app_metadata (chống leo thang quyền)
-- 2. Ẩn cột URL file khỏi anon (column-level GRANT)
-- 3. Siết RLS bảng lead (bỏ INSERT công khai)
-- 4. RPC consume_download_token (atomic, chống race)
-- Chạy trong Supabase SQL Editor. BACKUP DB trước khi chạy.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PHẦN 1: RLS dùng raw_app_meta_data thay vì raw_user_meta_data
-- (raw_user_meta_data do user tự sửa được → lỗ hổng leo thang quyền)
-- ─────────────────────────────────────────────────────────────

-- ── danh_muc_ban_ve ──
DROP POLICY IF EXISTS "Public read danh_muc"   ON danh_muc_ban_ve;
DROP POLICY IF EXISTS "Quan_ly write danh_muc" ON danh_muc_ban_ve;

CREATE POLICY "Public read danh_muc"
  ON danh_muc_ban_ve FOR SELECT USING (true);

CREATE POLICY "Quan_ly write danh_muc"
  ON danh_muc_ban_ve FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'quan_ly'
    )
  );

-- ── ban_ve ──
DROP POLICY IF EXISTS "Public select da_xuat" ON ban_ve;
DROP POLICY IF EXISTS "Bien_tap insert own"   ON ban_ve;
DROP POLICY IF EXISTS "Bien_tap update own"   ON ban_ve;
DROP POLICY IF EXISTS "Quan_ly delete"        ON ban_ve;

CREATE POLICY "Public select da_xuat"
  ON ban_ve FOR SELECT
  USING (
    trang_thai = 'da_xuat'
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Bien_tap insert own"
  ON ban_ve FOR INSERT
  WITH CHECK (
    auth.uid() = nguoi_tao_id
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' IN ('bien_tap', 'quan_ly')
    )
  );

CREATE POLICY "Bien_tap update own"
  ON ban_ve FOR UPDATE
  USING (
    nguoi_tao_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'quan_ly'
    )
  );

CREATE POLICY "Quan_ly delete"
  ON ban_ve FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'quan_ly'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- PHẦN 2: Ẩn URL file thật khỏi anon
-- anon (khách vãng lai) KHÔNG được đọc file_pdf_url / file_cad_url.
-- authenticated (CMS) đọc đủ cột. service_role (API) bypass RLS.
-- ─────────────────────────────────────────────────────────────

REVOKE SELECT ON public.ban_ve FROM anon, authenticated;

-- anon: chỉ các cột an toàn (KHÔNG có file_pdf_url, file_cad_url, nguoi_tao_id)
GRANT SELECT (
  id, ma_gxn, tieu_de, slug, danh_muc_id,
  loai_ct, phong_cach_1, phong_cach_2,
  chieu_dai, chieu_rong, so_tang, dien_tich_san, so_phong_ngu, tinh_id,
  mo_ta, the_tag, anh_bia, anh_phu,
  goi_tai, seo_title, seo_description, seo_keywords,
  trang_thai, luot_xem, luot_tai, created_at, updated_at
) ON public.ban_ve TO anon;

-- authenticated (CMS user): đọc tất cả cột
GRANT SELECT ON public.ban_ve TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- PHẦN 3: Siết RLS bảng lead_ban_ve
-- Bỏ INSERT công khai (lead chỉ vào qua /api/leads dùng service_role).
-- SELECT/UPDATE chỉ cho CMS user có role.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone insert lead"      ON lead_ban_ve;
DROP POLICY IF EXISTS "CMS read leads"          ON lead_ban_ve;
DROP POLICY IF EXISTS "CMS update lead status"  ON lead_ban_ve;

-- KHÔNG tạo lại policy INSERT cho anon → anon không ghi thẳng được.
-- service_role (dùng trong /api/leads) tự bypass RLS.

CREATE POLICY "CMS read leads"
  ON lead_ban_ve FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' IN ('bien_tap', 'quan_ly')
    )
  );

CREATE POLICY "CMS update lead"
  ON lead_ban_ve FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' IN ('bien_tap', 'quan_ly')
    )
  );

-- Thu hồi quyền ghi trực tiếp của anon (belt & suspenders)
REVOKE INSERT, UPDATE, DELETE ON public.lead_ban_ve FROM anon;

-- ─────────────────────────────────────────────────────────────
-- PHẦN 4: RPC tiêu thụ token tải — ATOMIC (chống race condition)
-- Chỉ tăng use_count khi còn hạn & còn lượt; trả về trong 1 câu lệnh.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION consume_download_token(p_token text)
RETURNS TABLE(out_ban_ve_id uuid, was_first boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ban_ve_id uuid;
  v_new_count int;
BEGIN
  UPDATE download_tokens
    SET use_count = use_count + 1
    WHERE token = p_token
      AND expires_at > now()
      AND use_count < max_uses
    RETURNING ban_ve_id, use_count INTO v_ban_ve_id, v_new_count;

  IF NOT FOUND THEN
    RETURN;                       -- token không hợp lệ / hết hạn / hết lượt
  END IF;

  out_ban_ve_id := v_ban_ve_id;
  was_first     := (v_new_count = 1);   -- lần dùng đầu tiên (đếm lượt tải thật)
  RETURN NEXT;
END;
$$;

-- Chỉ service_role được gọi (API route)
REVOKE ALL ON FUNCTION consume_download_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_download_token(text) TO service_role;

-- ============================================================
-- ROLLBACK (nếu cần hoàn tác — chạy thủ công):
--   Khôi phục các policy cũ từ 001_create_tables.sql (bản raw_user_meta_data)
--   GRANT SELECT ON public.ban_ve TO anon, authenticated;
--   DROP FUNCTION IF EXISTS consume_download_token(text);
-- ============================================================
