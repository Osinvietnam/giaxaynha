// ============================================================
// POST /api/leads — Secure download gate
// 1. Validate input
// 2. Rate limiting theo SĐT + bản vẽ + ngày
// 3. Tạo token 256-bit, lưu DB
// 4. Trả /api/download/[token] — URL thật KHÔNG bao giờ lộ ra client
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'
import type { SubmitLeadResponse } from '@/lib/types'

// ── Config (override bằng env vars) ──────────────────────────
const DOWNLOAD_LIMIT_PER_DAY = parseInt(process.env.DOWNLOAD_LIMIT_PER_DAY ?? '5')
const TOKEN_MAX_USES          = parseInt(process.env.TOKEN_MAX_USES          ?? '3')
const TOKEN_EXPIRE_HOURS      = parseInt(process.env.TOKEN_EXPIRE_HOURS      ?? '24')
// HASH_SALT phải set trong Vercel env vars — fail-hard ở production (kiểm trong handler)
const HASH_SALT = process.env.HASH_SALT
const SALT = HASH_SALT ?? 'gxn_dev_salt_only_local'

// ── Helpers ───────────────────────────────────────────────────

/** Hash SĐT → không lưu số thật vào DB */
function hashPhone(phone: string): string {
  return createHash('sha256').update(SALT + phone).digest('hex')
}

/**
 * Chuẩn hoá SĐT Việt Nam về DẠNG DUY NHẤT (0xxxxxxxxx) để rate-limit
 * không bị lách bằng +84 / 84 / khoảng trắng.
 */
function cleanPhone(phone: string): string {
  let p = phone.replace(/[\s\-().]/g, '')
  if (p.startsWith('+84'))                        p = '0' + p.slice(3)
  else if (p.startsWith('84') && p.length >= 11)  p = '0' + p.slice(2)
  return p
}

// Rate-limit theo IP qua Upstash REST (task 3.7). Chưa cấu hình env → bỏ qua.
const IP_LIMIT_PER_HOUR = parseInt(process.env.LEADS_IP_LIMIT_PER_HOUR ?? '20', 10)

async function ipRateLimitOk(ip: string): Promise<boolean> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return true // chưa bật rate-limit IP

  const hour = new Date().toISOString().slice(0, 13) // theo giờ UTC
  const key  = `rl:leads:${ip}:${hour}`
  try {
    const res  = await fetch(`${url}/incr/${key}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    const json = await res.json() as { result: number }
    if (json.result === 1) {
      await fetch(`${url}/expire/${key}/3600`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      })
    }
    return json.result <= IP_LIMIT_PER_HOUR
  } catch {
    return true // lỗi Upstash → không chặn người dùng
  }
}

// ── Zod Schema ────────────────────────────────────────────────

const leadSchema = z.object({
  ban_ve_id:     z.string().uuid(),
  ho_ten:        z.string().max(100).optional(),
  so_dien_thoai: z.string().min(9).max(15)
                  .regex(/^[0-9+\s\-()]+$/, 'SĐT không hợp lệ'),
  tinh_id:       z.number().int().min(1).max(63).optional(),
  nhu_cau:       z.enum(['tham_khao','muon_thicong','can_tuvan','khac']).optional(),
})

// ── Handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<SubmitLeadResponse>> {
  try {
    // Fail-hard: không cho chạy production nếu chưa cấu hình HASH_SALT
    if (!HASH_SALT && process.env.NODE_ENV === 'production') {
      console.error('[leads] HASH_SALT chưa được cấu hình trên production')
      return NextResponse.json(
        { success: false, error: 'Hệ thống chưa cấu hình đầy đủ' },
        { status: 500 }
      )
    }

    // Rate-limit theo IP (chống bơm SĐT giả) — trước khi chạm DB
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
    if (!(await ipRateLimitOk(ip))) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' },
        { status: 429 }
      )
    }

    const body   = await req.json()
    const parsed = leadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { ban_ve_id, ho_ten, so_dien_thoai, tinh_id, nhu_cau } = parsed.data
    const phone      = cleanPhone(so_dien_thoai)
    const phoneHash  = hashPhone(phone)
    const supabase   = createServiceClient()

    // 1. Kiểm tra bản vẽ tồn tại và đã xuất bản
    const { data: banVe, error: banVeErr } = await supabase
      .from('ban_ve')
      .select('id, tieu_de, ma_gxn, file_pdf_url, goi_tai, trang_thai')
      .eq('id', ban_ve_id)
      .eq('trang_thai', 'da_xuat')
      .single()

    if (banVeErr || !banVe) {
      return NextResponse.json(
        { success: false, error: 'Bản vẽ không tồn tại' },
        { status: 404 }
      )
    }

    if (!banVe.file_pdf_url) {
      return NextResponse.json(
        { success: false, error: 'File PDF chưa sẵn sàng' },
        { status: 503 }
      )
    }

    // 2. Rate limiting: đếm token đã tạo hôm nay cho phone + bản vẽ này
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('download_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('phone_hash', phoneHash)
      .eq('ban_ve_id', ban_ve_id)
      .gte('created_at', todayStart.toISOString())

    if ((todayCount ?? 0) >= DOWNLOAD_LIMIT_PER_DAY) {
      return NextResponse.json(
        { success: false, error: `Bạn đã tải bản vẽ này ${DOWNLOAD_LIMIT_PER_DAY} lần hôm nay. Vui lòng thử lại vào ngày mai.` },
        { status: 429 }
      )
    }

    // 3. Lưu lead vào DB
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRE_HOURS * 3600_000)

    const { data: lead, error: leadErr } = await supabase
      .from('lead_ban_ve')
      .insert({
        ban_ve_id,
        ho_ten:          ho_ten ?? null,
        so_dien_thoai:   phone,
        tinh_id:         tinh_id ?? null,
        nhu_cau:         nhu_cau ?? null,
        trang_thai_gd:   'cho_goi',
      })
      .select('id')
      .single()

    if (leadErr || !lead) {
      console.error('[leads] Insert error:', leadErr)
      return NextResponse.json(
        { success: false, error: 'Lỗi lưu dữ liệu' },
        { status: 500 }
      )
    }

    // 4. Tạo download token bảo mật (256-bit random)
    const token = randomBytes(32).toString('hex')

    const { error: tokenErr } = await supabase
      .from('download_tokens')
      .insert({
        token,
        ban_ve_id,
        lead_id:    lead.id,
        phone_hash: phoneHash,
        expires_at: expiresAt.toISOString(),
        max_uses:   TOKEN_MAX_USES,
      })

    if (tokenErr) {
      console.error('[leads] Token insert error:', tokenErr)
      return NextResponse.json(
        { success: false, error: 'Lỗi tạo link tải' },
        { status: 500 }
      )
    }

    // 5. Trigger N8n Webhook (non-blocking)
    if (process.env.N8N_LEAD_WEBHOOK_URL) {
      fetch(process.env.N8N_LEAD_WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id:         lead.id,
          ban_ve_tieu_de:  banVe.tieu_de,
          ma_gxn:          banVe.ma_gxn,
          ho_ten:          ho_ten ?? 'Không có',
          so_dien_thoai:   phone,
          tinh_id:         tinh_id ?? null,
          nhu_cau:         nhu_cau ?? null,
        }),
      }).catch(err => console.error('[N8n] Failed:', err))
    }

    // 6. Trả proxy URL — URL thật không bao giờ xuất hiện ở client
    return NextResponse.json({
      success:      true,
      download_url: `/api/download/${token}`,
      expires_at:   expiresAt.toISOString(),
    })

  } catch (err) {
    console.error('[leads] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}
