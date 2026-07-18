'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const VALID_STATUS = ['cho_goi', 'dang_tuvan', 'da_chot', 'khong_dt'] as const

// Đổi trạng thái + ghi chú lead (task 1.10) — RLS chỉ cho CMS role
export async function updateLeadStatus(
  id: string,
  status: string,
  ghiChu?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])) {
    return { ok: false, error: 'Trạng thái không hợp lệ' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Phiên đăng nhập hết hạn' }

  const patch: Record<string, unknown> = { trang_thai_gd: status }
  if (typeof ghiChu === 'string') patch.ghi_chu_crm = ghiChu.trim() || null

  const { error } = await supabase.from('lead_ban_ve').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/cms/leads')
  return { ok: true }
}
