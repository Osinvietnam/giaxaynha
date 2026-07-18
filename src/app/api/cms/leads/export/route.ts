// GET /api/cms/leads/export — Xuất CSV leads (task 1.13)
// Auth qua Supabase (RLS chỉ cho CMS role đọc); BOM UTF-8 để Excel mở đúng tiếng Việt.

import { createClient } from '@/lib/supabase/server'
import { TINH, NHU_CAU_LABELS } from '@/lib/constants'

const STATUS_LABEL: Record<string, string> = {
  cho_goi:    'Chờ gọi',
  dang_tuvan: 'Đang tư vấn',
  da_chot:    'Đã chốt',
  khong_dt:   'Không bắt được',
}

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)

  let query = supabase
    .from('lead_ban_ve')
    .select(`
      ho_ten, so_dien_thoai, tinh_id, nhu_cau, trang_thai_gd, ghi_chu_crm, created_at,
      ban_ve:ban_ve_id(ma_gxn, tieu_de)
    `)
    .order('created_at', { ascending: false })

  const tt = searchParams.get('trang_thai_gd')
  if (tt) query = query.eq('trang_thai_gd', tt)
  const q = searchParams.get('q')
  if (q) query = query.ilike('so_dien_thoai', `%${q}%`)

  const { data, error } = await query
  if (error) return new Response('Lỗi truy vấn', { status: 500 })

  const header = ['Họ tên', 'SĐT', 'Tỉnh/Thành', 'Nhu cầu', 'Trạng thái', 'Bản vẽ', 'Mã GXN', 'Ghi chú', 'Thời gian']
  const lines = [header.map(csvCell).join(',')]

  for (const l of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bv: any = Array.isArray(l.ban_ve) ? l.ban_ve[0] : l.ban_ve
    lines.push([
      csvCell(l.ho_ten),
      csvCell(l.so_dien_thoai),
      csvCell(l.tinh_id ? TINH[l.tinh_id] : ''),
      csvCell(l.nhu_cau ? NHU_CAU_LABELS[l.nhu_cau] ?? l.nhu_cau : ''),
      csvCell(STATUS_LABEL[l.trang_thai_gd] ?? l.trang_thai_gd),
      csvCell(bv?.tieu_de ?? ''),
      csvCell(bv?.ma_gxn ?? ''),
      csvCell(l.ghi_chu_crm ?? ''),
      csvCell(new Date(l.created_at).toLocaleString('vi-VN')),
    ].join(','))
  }

  const BOM = String.fromCharCode(0xfeff)
  const csv = BOM + lines.join('\r\n')
  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
