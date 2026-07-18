// POST /api/cms/import-ban-ve/commit — chèn hàng loạt bản vẽ đã xem trước (task 4.6)
import { createClient } from '@/lib/supabase/server'

interface ImportRow {
  ma_gxn: string; tieu_de: string; slug: string
  loai_ct: number; phong_cach_1: number; phong_cach_2: number | null
  so_tang: number | null; chieu_rong: number | null; chieu_dai: number | null
  dien_tich_san: number | null; so_phong_ngu: number | null; tinh_id: number | null
  file_pdf_url: string | null; file_cad_url: string | null; anh_bia: string | null
  mo_ta: string | null; the_tag: string[]; goi_tai: string
  seo_title: string | null; seo_description: string | null; trang_thai: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => null) as { rows?: ImportRow[] } | null
  const rows = body?.rows
  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: 'Không có dữ liệu' }, { status: 400 })
  }
  if (rows.length > 500) {
    return Response.json({ error: 'Tối đa 500 dòng mỗi lần import' }, { status: 400 })
  }

  let inserted = 0
  const failed: { ma_gxn: string; error: string }[] = []

  for (const row of rows) {
    const { error } = await supabase.from('ban_ve').insert({
      ma_gxn: row.ma_gxn,
      tieu_de: row.tieu_de,
      slug: row.slug,
      loai_ct: row.loai_ct,
      phong_cach_1: row.phong_cach_1,
      phong_cach_2: row.phong_cach_2,
      so_tang: row.so_tang,
      chieu_rong: row.chieu_rong,
      chieu_dai: row.chieu_dai,
      dien_tich_san: row.dien_tich_san,
      so_phong_ngu: row.so_phong_ngu,
      tinh_id: row.tinh_id,
      file_pdf_url: row.file_pdf_url,
      file_cad_url: row.file_cad_url,
      anh_bia: row.anh_bia,
      mo_ta: row.mo_ta,
      the_tag: row.the_tag ?? [],
      goi_tai: row.goi_tai,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      trang_thai: row.trang_thai,
      nguoi_tao_id: user.id,
    })
    if (error) {
      failed.push({
        ma_gxn: row.ma_gxn,
        error: error.code === '23505' ? 'Mã GXN trùng' : error.message,
      })
    } else {
      inserted++
    }
  }

  return Response.json({ inserted, failed })
}
