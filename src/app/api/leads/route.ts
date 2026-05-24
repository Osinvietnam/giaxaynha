// ============================================================
// POST /api/leads
// Nhận lead từ download modal → save DB → trigger N8n → trả Drive URL
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { SubmitLeadResponse } from '@/lib/types'

// Validate request body
const leadSchema = z.object({
  ban_ve_id:       z.string().uuid(),
  ho_ten:          z.string().max(100).optional(),
  so_dien_thoai:   z.string().min(9).max(15).regex(/^[0-9+\s\-()]+$/, 'SĐT không hợp lệ'),
  tinh_id:         z.number().int().min(1).max(63).optional(),
  nhu_cau:         z.enum(['tham_khao','muon_thicong','can_tuvan','khac']).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse<SubmitLeadResponse>> {
  try {
    const body = await req.json()
    const parsed = leadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { ban_ve_id, ho_ten, so_dien_thoai, tinh_id, nhu_cau } = parsed.data
    const supabase = createServiceClient()

    // 1. Kiểm tra bản vẽ tồn tại và có file_pdf_url
    const { data: banVe, error: banVeError } = await supabase
      .from('ban_ve')
      .select('id, tieu_de, ma_gxn, file_pdf_url, goi_tai, trang_thai')
      .eq('id', ban_ve_id)
      .eq('trang_thai', 'da_xuat')
      .single()

    if (banVeError || !banVe) {
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

    // 2. Tính thời hạn URL (72 giờ)
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

    // 3. Lưu lead vào DB
    const { data: lead, error: leadError } = await supabase
      .from('lead_ban_ve')
      .insert({
        ban_ve_id,
        ho_ten:          ho_ten ?? null,
        so_dien_thoai:   so_dien_thoai.replace(/\s/g, ''),
        tinh_id:         tinh_id ?? null,
        nhu_cau:         nhu_cau ?? null,
        drive_url:       banVe.file_pdf_url,
        url_expires_at:  expiresAt.toISOString(),
        trang_thai_gd:   'cho_goi',
      })
      .select('id')
      .single()

    if (leadError) {
      console.error('[leads] Insert error:', leadError)
      return NextResponse.json(
        { success: false, error: 'Lỗi lưu dữ liệu' },
        { status: 500 }
      )
    }

    // 4. Tăng lượt tải (non-blocking)
    supabase.rpc('increment_luot_tai', { ban_ve_id }).then(() => {})

    // 5. Trigger N8n Webhook (non-blocking — không chặn response)
    if (process.env.N8N_LEAD_WEBHOOK_URL) {
      fetch(process.env.N8N_LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id:       lead.id,
          ban_ve_tieu_de: banVe.tieu_de,
          ma_gxn:        banVe.ma_gxn,
          ho_ten:        ho_ten ?? 'Không có',
          so_dien_thoai: so_dien_thoai,
          tinh_id:       tinh_id ?? null,
          nhu_cau:       nhu_cau ?? null,
          drive_url:     banVe.file_pdf_url,
        }),
      }).catch(err => console.error('[N8n trigger] Failed:', err))
    }

    // 6. Trả Drive URL về cho frontend
    return NextResponse.json({
      success:    true,
      drive_url:  banVe.file_pdf_url,
      expires_at: expiresAt.toISOString(),
    })

  } catch (err) {
    console.error('[leads] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}
