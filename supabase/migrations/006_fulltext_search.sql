-- ============================================================
-- Migration 006: Tìm kiếm KHÔNG DẤU (Đợt 1 — task 1.2)
-- Thêm cột search_text (đã bỏ dấu, lowercase) + index trgm.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper IMMUTABLE để dùng được trong generated column & index
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT lower(unaccent('unaccent'::regdictionary, $1)) $$;

-- Cột search_text: gộp tiêu đề + mô tả + tags, đã bỏ dấu
ALTER TABLE ban_ve
  ADD COLUMN IF NOT EXISTS search_text text
  GENERATED ALWAYS AS (
    f_unaccent(
      coalesce(tieu_de, '') || ' ' ||
      coalesce(mo_ta, '')   || ' ' ||
      coalesce(array_to_string(the_tag, ' '), '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_ban_ve_search
  ON ban_ve USING gin (search_text gin_trgm_ops);

-- anon cần quyền đọc/lọc theo cột này (migration 005 chưa cấp vì cột chưa tồn tại)
GRANT SELECT (search_text) ON ban_ve TO anon;

-- ============================================================
-- ROLLBACK:
--   DROP INDEX IF EXISTS idx_ban_ve_search;
--   ALTER TABLE ban_ve DROP COLUMN IF EXISTS search_text;
--   DROP FUNCTION IF EXISTS f_unaccent(text);
-- ============================================================
