-- ================================================================
-- Migration 004: Secure download tokens
-- Token ngẫu nhiên 256-bit, rate limiting, không lộ URL thật
-- ================================================================

CREATE TABLE download_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT        UNIQUE NOT NULL,               -- 64-char hex (256-bit random)
  ban_ve_id   UUID        NOT NULL REFERENCES ban_ve(id) ON DELETE CASCADE,
  lead_id     UUID        NOT NULL REFERENCES lead_ban_ve(id) ON DELETE CASCADE,
  phone_hash  TEXT        NOT NULL,                      -- SHA-256(phone + SALT), không lưu SĐT thật
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  use_count   INT         NOT NULL DEFAULT 0,
  max_uses    INT         NOT NULL DEFAULT 3,            -- cho phép retry 3 lần
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index tra cứu token nhanh (mỗi request download)
CREATE INDEX idx_dl_token       ON download_tokens(token);
-- Index rate limiting: đếm token theo phone + bản vẽ trong ngày
CREATE INDEX idx_dl_phone_bv    ON download_tokens(phone_hash, ban_ve_id, created_at);
-- Index cleanup token hết hạn
CREATE INDEX idx_dl_expires     ON download_tokens(expires_at);

-- RLS: bảng nhạy cảm — KHÔNG cho client trực tiếp đọc
-- Chỉ dùng qua service role trong API routes
ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;
-- Không tạo policy public — service role bypass RLS tự động

-- Tự dọn token hết hạn quá 7 ngày (chạy thủ công hoặc pg_cron nếu có)
-- DELETE FROM download_tokens WHERE expires_at < NOW() - INTERVAL '7 days';
