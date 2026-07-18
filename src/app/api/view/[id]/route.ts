// POST /api/view/[id] — tăng lượt xem (task 3.3)
// Tách khỏi render trang chi tiết để trang cache/ISR được.
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response(null, { status: 400 })
  }
  const supabase = createServiceClient()
  await supabase.rpc('increment_luot_xem', { ban_ve_id: id })
  return new Response(null, { status: 204 })
}
