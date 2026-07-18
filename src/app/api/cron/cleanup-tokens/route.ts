// GET /api/cron/cleanup-tokens — dọn token tải hết hạn > 7 ngày (task 3.9)
// Vercel Cron gọi hằng ngày (xem vercel.json). Bảo vệ bằng CRON_SECRET.
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const supabase = createServiceClient()
  const { error, count } = await supabase
    .from('download_tokens')
    .delete({ count: 'exact' })
    .lt('expires_at', cutoff)

  if (error) {
    console.error('[cron cleanup-tokens]', error)
    return new Response('error', { status: 500 })
  }
  return Response.json({ ok: true, deleted: count ?? 0 })
}
