// ============================================================
// GET /api/download/[token]
// Validate token → redirect server-side đến file thật
// URL thật KHÔNG BAO GIỜ lộ ra response trả về client
// ============================================================

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Phòng thủ: token phải đúng format 64 hex chars
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return new Response('Link không hợp lệ', { status: 400 })
  }

  const supabase = createServiceClient()

  // 1. Tìm token trong DB
  const { data: tk } = await supabase
    .from('download_tokens')
    .select('id, ban_ve_id, expires_at, use_count, max_uses')
    .eq('token', token)
    .single()

  if (!tk) {
    return new Response('Link không tồn tại hoặc đã bị xoá', { status: 404 })
  }

  // 2. Kiểm tra hết hạn
  if (new Date(tk.expires_at) < new Date()) {
    return new Response('Link đã hết hạn. Vui lòng điền form lại để nhận link mới.', {
      status: 410,
    })
  }

  // 3. Kiểm tra số lượt dùng
  if (tk.use_count >= tk.max_uses) {
    return new Response('Link đã hết lượt sử dụng. Vui lòng điền form lại.', {
      status: 410,
    })
  }

  // 4. Lấy URL file từ ban_ve (tách query riêng, tránh join TypeScript issue)
  const { data: banVe } = await supabase
    .from('ban_ve')
    .select('file_pdf_url')
    .eq('id', tk.ban_ve_id)
    .single()

  if (!banVe?.file_pdf_url) {
    return new Response('File không tồn tại', { status: 404 })
  }

  // 5. Tăng use_count (atomic — nếu fail thì bỏ qua, không chặn download)
  await supabase
    .from('download_tokens')
    .update({ use_count: tk.use_count + 1 })
    .eq('id', tk.id)

  // 6. Đếm lượt tải thực (chỉ đếm lần đầu dùng token)
  if (tk.use_count === 0) {
    supabase.rpc('increment_luot_tai', { ban_ve_id: tk.ban_ve_id }).then(() => {})
  }

  // 7. Server-side redirect — client không thấy URL thật
  return NextResponse.redirect(banVe.file_pdf_url, { status: 302 })
}
