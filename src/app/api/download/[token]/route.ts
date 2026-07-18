// ============================================================
// GET /api/download/[token]
// 1. Tiêu thụ token ATOMIC (RPC consume_download_token) — chống race
// 2. Resolve URL file: Supabase Storage (signed) hoặc OneDrive (direct)
// 3. STREAM bytes về client — URL thật KHÔNG BAO GIỜ lộ (kể cả header)
// ============================================================

import { createServiceClient } from '@/lib/supabase/server'

const FILES_BUCKET = 'ban-ve-files'
const SIGN_TTL = 300 // giây — link ký nội bộ, chỉ dùng để fetch server-side

/** Chuyển share-link OneDrive/SharePoint → URL tải trực tiếp (nội dung file) */
function toDirectDownload(url: string): string {
  // OneDrive cá nhân (1drv.ms, onedrive.live.com) → Shares content API
  if (/1drv\.ms|onedrive\.live\.com/i.test(url)) {
    const b64 = Buffer.from(url, 'utf8').toString('base64')
      .replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-')
    return `https://api.onedrive.com/v1.0/shares/u!${b64}/root/content`
  }
  // SharePoint / OneDrive for Business (link "Anyone with the link") → thêm download=1
  if (/sharepoint\.com/i.test(url)) {
    return url + (url.includes('?') ? '&' : '?') + 'download=1'
  }
  return url
}

/** Trích object key trong bucket ban-ve-files từ giá trị đã lưu */
function storageKey(fileUrl: string): string | null {
  const marker = `/storage/v1/object/public/${FILES_BUCKET}/`
  const i = fileUrl.indexOf(marker)
  if (i !== -1) return decodeURIComponent(fileUrl.slice(i + marker.length))
  // Giá trị lưu dạng object key trần (không http) → coi là key trong bucket
  if (!/^https?:\/\//i.test(fileUrl)) return fileUrl.replace(/^\/+/, '')
  return null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Token phải đúng format 64 hex chars
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return new Response('Link không hợp lệ', { status: 400 })
  }

  const supabase = createServiceClient()

  // 1. Tiêu thụ token ATOMIC — chỉ thành công khi còn hạn & còn lượt
  const { data: consumed, error: rpcErr } = await supabase
    .rpc('consume_download_token', { p_token: token })

  const row = Array.isArray(consumed) ? consumed[0] : consumed

  if (rpcErr || !row) {
    // Xác định lý do để báo thân thiện (chỉ 1 query khi thất bại)
    const { data: tk } = await supabase
      .from('download_tokens')
      .select('expires_at, use_count, max_uses')
      .eq('token', token)
      .single()
    if (!tk) return new Response('Link không tồn tại hoặc đã bị xoá', { status: 404 })
    if (new Date(tk.expires_at) < new Date())
      return new Response('Link đã hết hạn. Vui lòng điền form lại để nhận link mới.', { status: 410 })
    return new Response('Link đã hết lượt tải. Vui lòng điền form lại.', { status: 410 })
  }

  const banVeId: string   = row.out_ban_ve_id
  const wasFirst: boolean = row.was_first

  // 2. Lấy URL file thật (service role — bypass RLS)
  const { data: banVe } = await supabase
    .from('ban_ve')
    .select('file_pdf_url, ma_gxn')
    .eq('id', banVeId)
    .single()

  if (!banVe?.file_pdf_url) {
    return new Response('File không tồn tại', { status: 404 })
  }

  // 3. Resolve URL thật để fetch server-side
  let fetchUrl: string
  const key = storageKey(banVe.file_pdf_url)
  if (key) {
    const { data: signed, error: signErr } = await supabase
      .storage.from(FILES_BUCKET).createSignedUrl(key, SIGN_TTL)
    if (signErr || !signed?.signedUrl) {
      return new Response('Không tạo được link tải', { status: 500 })
    }
    fetchUrl = signed.signedUrl
  } else {
    fetchUrl = toDirectDownload(banVe.file_pdf_url)
  }

  // 4. Đếm lượt tải thật (chỉ lần đầu dùng token) — await để chắc chắn chạy
  if (wasFirst) {
    await supabase.rpc('increment_luot_tai', { ban_ve_id: banVeId })
  }

  // 5. STREAM bytes — client không bao giờ thấy URL thật (kể cả trong Location)
  let upstream: Response
  try {
    upstream = await fetch(fetchUrl, { redirect: 'follow' })
  } catch {
    return new Response('Không kết nối được tới kho file', { status: 502 })
  }
  if (!upstream.ok || !upstream.body) {
    return new Response('Không tải được file từ kho', { status: 502 })
  }

  const headers = new Headers()
  const ct = upstream.headers.get('content-type') ?? 'application/pdf'
  headers.set('Content-Type', ct)
  headers.set('Content-Disposition', `attachment; filename="${banVe.ma_gxn}.pdf"`)
  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)
  headers.set('Cache-Control', 'no-store')

  return new Response(upstream.body, { status: 200, headers })
}
