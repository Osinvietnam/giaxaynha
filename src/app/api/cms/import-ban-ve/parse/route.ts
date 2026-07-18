// POST /api/cms/import-ban-ve/parse — đọc file Excel, map + validate (task 4.6)
// Trả về rows đã chuẩn hoá + lỗi từng dòng (KHÔNG ghi DB — chỉ xem trước)
import ExcelJS from 'exceljs'
import slugify from 'slugify'
import { createClient } from '@/lib/supabase/server'
import { LOAI_CT, PHONG_CACH, TINH, sinhMaGXN } from '@/lib/constants'

const LOAI_BY_NAME = Object.fromEntries(Object.entries(LOAI_CT).map(([k, v]) => [v.ten.trim().toLowerCase(), Number(k)]))
const PC_BY_NAME   = Object.fromEntries(Object.entries(PHONG_CACH).map(([k, v]) => [v.ten.trim().toLowerCase(), Number(k)]))
const TINH_BY_NAME = Object.fromEntries(Object.entries(TINH).map(([k, v]) => [v.trim().toLowerCase(), Number(k)]))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cellText(cell: any): string {
  const v = cell?.value
  if (v == null) return ''
  if (typeof v === 'object') {
    if (typeof v.text === 'string') return v.text.trim()
    if (v.hyperlink) return String(v.hyperlink).trim()
    if (v.result != null) return String(v.result).trim()
    if (Array.isArray(v.richText)) return v.richText.map((r: { text: string }) => r.text).join('').trim()
    return ''
  }
  return String(v).trim()
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function numOrNull(cell: any): number | null {
  const t = cellText(cell).replace(',', '.')
  const n = parseFloat(t)
  return isNaN(n) ? null : n
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Thiếu file' }, { status: 400 })
  }

  const wb = new ExcelJS.Workbook()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any)
  } catch {
    return Response.json({ error: 'File không đọc được (phải là .xlsx)' }, { status: 400 })
  }

  const ws = wb.getWorksheet('📋 Ban Ve') ?? wb.worksheets[0]
  if (!ws) return Response.json({ error: 'Không tìm thấy sheet dữ liệu' }, { status: 400 })

  const rows: Record<string, unknown>[] = []
  const DATA_START = 5 // hàng 1-3 tiêu đề, hàng 4 mẫu

  for (let r = DATA_START; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const tieuDe = cellText(row.getCell(3))
    if (!tieuDe) continue // dòng trống

    const errors: string[] = []
    const loaiName = cellText(row.getCell(4)).toLowerCase()
    const pc1Name  = cellText(row.getCell(5)).toLowerCase()
    const pc2Name  = cellText(row.getCell(6)).toLowerCase()
    const tinhName = cellText(row.getCell(12)).toLowerCase()
    const goiRaw   = cellText(row.getCell(13)).toLowerCase()
    const pdfUrl   = cellText(row.getCell(14))
    const ttRaw    = cellText(row.getCell(19)).toLowerCase()

    const loaiCt = LOAI_BY_NAME[loaiName]
    const pc1    = PC_BY_NAME[pc1Name]
    const pc2    = pc2Name ? PC_BY_NAME[pc2Name] ?? null : null
    const tinhId = tinhName ? TINH_BY_NAME[tinhName] ?? null : null
    const goiTai = goiRaw.includes('free') || goiRaw.includes('miễn') ? 'free' : 'basic'
    const trangThai = ttRaw.includes('xuất') ? 'da_xuat' : ttRaw.includes('duyệt') ? 'cho_duyet' : 'nhap'

    if (!loaiCt) errors.push(`Loại CT không hợp lệ: "${cellText(row.getCell(4))}"`)
    if (!pc1)    errors.push(`Phong cách 1 không hợp lệ: "${cellText(row.getCell(5))}"`)
    if (!pdfUrl) errors.push('Thiếu link PDF')

    const maGxnCell = cellText(row.getCell(2))
    const maGxn = maGxnCell && !maGxnCell.startsWith('=')
      ? maGxnCell
      : (loaiCt && pc1)
        ? sinhMaGXN({ goiCode: goiTai === 'free' ? 1 : 2, tinhId: tinhId ?? 0, loaiCt, phongCach1: pc1, phongCach2: pc2 ?? pc1 })
        : ''

    const slug = maGxn
      ? `${slugify(tieuDe, { lower: true, strict: true, locale: 'vi' })}-${maGxn.toLowerCase().replace(/_/g, '-')}`
      : ''

    rows.push({
      excelRow: r,
      ma_gxn: maGxn,
      tieu_de: tieuDe,
      slug,
      loai_ct: loaiCt ?? null,
      phong_cach_1: pc1 ?? null,
      phong_cach_2: pc2,
      so_tang: numOrNull(row.getCell(7)),
      chieu_rong: numOrNull(row.getCell(8)),
      chieu_dai: numOrNull(row.getCell(9)),
      dien_tich_san: numOrNull(row.getCell(10)),
      so_phong_ngu: numOrNull(row.getCell(11)),
      tinh_id: tinhId,
      file_pdf_url: pdfUrl || null,
      file_cad_url: cellText(row.getCell(15)) || null,
      anh_bia: cellText(row.getCell(16)) || null,
      mo_ta: cellText(row.getCell(17)) || null,
      the_tag: cellText(row.getCell(18)) ? cellText(row.getCell(18)).split(',').map(s => s.trim()).filter(Boolean) : [],
      goi_tai: goiTai,
      seo_title: cellText(row.getCell(20)) || null,
      seo_description: cellText(row.getCell(21)) || null,
      trang_thai: trangThai,
      errors,
    })
  }

  return Response.json({
    total: rows.length,
    valid: rows.filter(r => (r.errors as string[]).length === 0).length,
    rows,
  })
}
