'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import slugify from 'slugify'
import { LOAI_CT, PHONG_CACH, TINH, sinhMaGXN } from '@/lib/constants'
import Link from 'next/link'

// Ánh xạ goi_tai → goiCode
const GOI_CODE = { free: 1, basic: 2 } as const

// ── File Dropzone Component ────────────────────────────────────
function FileDropzone({
  accept,
  label,
  hint,
  file,
  onDrop,
  required,
}: {
  accept: Record<string, string[]>
  label: string
  hint: string
  file: File | null
  onDrop: (file: File) => void
  required?: boolean
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    onDrop: (files) => { if (files[0]) onDrop(files[0]) },
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
        ${isDragActive
          ? 'border-blue-500 bg-blue-50'
          : file
            ? 'border-green-400 bg-green-50'
            : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
        }`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        {file ? (
          <>
            <div className="text-green-600 font-medium text-sm mb-0.5">✓ {file.name}</div>
            <div className="text-xs text-green-500">
              {(file.size / 1024 / 1024).toFixed(1)} MB — Nhấn để thay đổi
            </div>
          </>
        ) : (
          <>
            <div className="text-zinc-500 text-sm mb-0.5">
              {isDragActive ? `Thả ${label} vào đây...` : `Kéo thả ${label} ${required ? '(bắt buộc)' : '(tùy chọn)'}`}
            </div>
            <div className="text-xs text-zinc-400">{hint}</div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Form Label ─────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

// ── Input className ────────────────────────────────────────────
const inputCls = `w-full border border-zinc-300 rounded px-3 py-2 text-sm
  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400`

const selectCls = `w-full border border-zinc-300 rounded px-3 py-2 text-sm
  focus:outline-none focus:border-blue-400 bg-white`

// ── Main Page ──────────────────────────────────────────────────
export default function ThemMoiBanVePage() {
  const router = useRouter()

  // ── Form state ──
  const [tieuDe,      setTieuDe]      = useState('')
  const [loaiCt,      setLoaiCt]      = useState(1)
  const [phongCach1,  setPhongCach1]  = useState(3)   // Hiện đại mặc định
  const [phongCach2,  setPhongCach2]  = useState<number | null>(null)
  const [tinhId,      setTinhId]      = useState(1)   // Hà Nội mặc định
  const [chieuDai,    setChieuDai]    = useState('')
  const [chieuRong,   setChieuRong]   = useState('')
  const [soTang,      setSoTang]      = useState('')
  const [dienTichSan, setDienTichSan] = useState('')
  const [soPhongNgu,  setSoPhongNgu]  = useState('')
  const [moTa,        setMoTa]        = useState('')
  const [theTag,      setTheTag]      = useState('')
  const [goiTai,      setGoiTai]      = useState<'free' | 'basic'>('free')
  const [seoTitle,    setSeoTitle]    = useState('')
  const [seoDesc,     setSeoDesc]     = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')

  // ── Files ──
  const [pdfFile,     setPdfFile]     = useState<File | null>(null)
  const [cadFile,     setCadFile]     = useState<File | null>(null)
  const [coverImage,  setCoverImage]  = useState<File | null>(null)
  const [coverPreview,setCoverPreview]= useState<string | null>(null)

  // ── OneDrive / URL trực tiếp (thay thế upload) ──
  const [pdfMode,   setPdfMode]   = useState<'upload' | 'url'>('upload')
  const [cadMode,   setCadMode]   = useState<'upload' | 'url'>('upload')
  const [pdfUrlInput,  setPdfUrlInput]  = useState('')
  const [cadUrlInput,  setCadUrlInput]  = useState('')

  // ── Submit state ──
  const [submitting,  setSubmitting]  = useState(false)
  const [uploadStep,  setUploadStep]  = useState('')
  const [error,       setError]       = useState<string | null>(null)

  // ── Computed mã GXN ──
  const maGXN = sinhMaGXN({
    goiCode:    GOI_CODE[goiTai],
    tinhId,
    loaiCt,
    phongCach1,
    phongCach2: phongCach2 ?? phongCach1,
  })

  // Cover image dropzone với preview
  const { getRootProps: getCoverProps, getInputProps: getCoverInput, isDragActive: isCoverDrag }
    = useDropzone({
      accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
      maxFiles: 1,
      onDrop: useCallback((files: File[]) => {
        if (files[0]) {
          setCoverImage(files[0])
          setCoverPreview(URL.createObjectURL(files[0]))
        }
      }, []),
    })

  // ── Upload helper ──
  async function uploadToStorage(
    supabase: ReturnType<typeof createClient>,
    bucket: string,
    path: string,
    file: File,
  ): Promise<string> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw new Error(`Upload thất bại: ${error.message}`)
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  }

  // ── Submit ──
  async function handleSubmit(trangThai: 'nhap' | 'cho_duyet') {
    setError(null)

    if (!tieuDe.trim()) {
      setError('Vui lòng nhập tiêu đề bản vẽ.')
      return
    }
    const hasPdf = pdfMode === 'upload' ? !!pdfFile : !!pdfUrlInput.trim()
    if (trangThai === 'cho_duyet' && !hasPdf) {
      setError('Vui lòng tải lên file PDF hoặc nhập link OneDrive trước khi gửi duyệt.')
      return
    }

    setSubmitting(true)

    const supabase = createClient()

    try {
      // Lấy user hiện tại
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')

      let pdfUrl:   string | null = null
      let cadUrl:   string | null = null
      let coverUrl: string | null = null

      // PDF — upload file hoặc dùng URL OneDrive
      if (pdfMode === 'url' && pdfUrlInput.trim()) {
        pdfUrl = pdfUrlInput.trim()
      } else if (pdfMode === 'upload' && pdfFile) {
        setUploadStep('Đang tải file PDF...')
        pdfUrl = await uploadToStorage(
          supabase, 'ban-ve-files', `${maGXN}/ban-ve.pdf`, pdfFile,
        )
      }

      // CAD — upload file hoặc dùng URL OneDrive
      if (cadMode === 'url' && cadUrlInput.trim()) {
        cadUrl = cadUrlInput.trim()
      } else if (cadMode === 'upload' && cadFile) {
        setUploadStep('Đang tải file CAD...')
        const ext = cadFile.name.split('.').pop() ?? 'dwg'
        cadUrl = await uploadToStorage(
          supabase, 'ban-ve-files', `${maGXN}/ban-ve.${ext}`, cadFile,
        )
      }

      // Upload ảnh bìa
      if (coverImage) {
        setUploadStep('Đang tải ảnh bìa...')
        const ext = coverImage.name.split('.').pop() ?? 'jpg'
        coverUrl = await uploadToStorage(
          supabase, 'ban-ve-images', `${maGXN}/cover.${ext}`, coverImage,
        )
      }

      // Tìm danh_muc_id từ loai_ct slug
      setUploadStep('Đang lưu thông tin...')
      const loaiSlug = LOAI_CT[loaiCt]?.slug
      const { data: danhMuc } = loaiSlug
        ? await supabase.from('danh_muc_ban_ve').select('id').eq('slug', loaiSlug).single()
        : { data: null }

      // Tạo slug bản vẽ
      const baseSlug = slugify(tieuDe, { lower: true, strict: true, locale: 'vi' })
      const finalSlug = `${baseSlug}-${maGXN.toLowerCase().replace(/_/g, '-')}`

      // Insert vào DB
      const { error: insertError } = await supabase.from('ban_ve').insert({
        ma_gxn:          maGXN,
        tieu_de:         tieuDe.trim(),
        slug:            finalSlug,
        danh_muc_id:     danhMuc?.id ?? null,
        loai_ct:         loaiCt,
        phong_cach_1:    phongCach1,
        phong_cach_2:    phongCach2,
        tinh_id:         tinhId,
        chieu_dai:       chieuDai     ? parseFloat(chieuDai)     : null,
        chieu_rong:      chieuRong    ? parseFloat(chieuRong)    : null,
        so_tang:         soTang       ? parseInt(soTang, 10)     : null,
        dien_tich_san:   dienTichSan  ? parseFloat(dienTichSan)  : null,
        so_phong_ngu:    soPhongNgu   ? parseInt(soPhongNgu, 10) : null,
        mo_ta:           moTa.trim()  || null,
        the_tag:         theTag
          ? theTag.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        anh_bia:         coverUrl,
        anh_phu:         [],
        file_pdf_url:    pdfUrl,
        file_cad_url:    cadUrl,
        goi_tai:         goiTai,
        seo_title:       seoTitle.trim()    || null,
        seo_description: seoDesc.trim()     || null,
        seo_keywords:    seoKeywords
          ? seoKeywords.split(',').map(k => k.trim()).filter(Boolean)
          : [],
        trang_thai:      trangThai,
        nguoi_tao_id:    user.id,
      })

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error(`Mã GXN "${maGXN}" đã tồn tại. Thay đổi ngày tạo hoặc thông số để tạo mã mới.`)
        }
        throw new Error(insertError.message)
      }

      // Thành công → về danh sách
      router.push('/cms/ban-ve')
      router.refresh()

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi không xác định. Vui lòng thử lại.'
      setError(msg)
      setSubmitting(false)
      setUploadStep('')
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cms/ban-ve"
              className="text-zinc-400 hover:text-zinc-600 transition-colors">
          ← Quay lại
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Thêm bản vẽ mới</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Điền thông tin đầy đủ để tăng SEO và độ tìm kiếm</p>
        </div>
      </div>

      {/* Mã GXN preview — luôn hiển thị */}
      <div className="bg-zinc-900 rounded-xl p-5 mb-8 flex items-center gap-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Mã GXN (tự động)</p>
          <p className="text-xl font-bold font-mono text-white tracking-widest">{maGXN}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-zinc-500">Gói tải</p>
          <p className="text-sm font-medium text-zinc-200">
            {goiTai === 'free' ? 'Miễn phí' : 'Cơ bản'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── 1. Files ───────────────────────────────────────── */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-zinc-800 mb-4">
            📁 Files
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PDF */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required>File PDF (hồ sơ thiết kế)</Label>
                <div className="flex gap-1 text-[10px]">
                  {(['upload','url'] as const).map(m => (
                    <button key={m} type="button"
                      onClick={() => setPdfMode(m)}
                      className={`px-2 py-0.5 rounded border transition-colors
                        ${pdfMode === m
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-zinc-500 border-zinc-300 hover:border-zinc-400'}`}>
                      {m === 'upload' ? 'Upload' : 'OneDrive'}
                    </button>
                  ))}
                </div>
              </div>
              {pdfMode === 'upload' ? (
                <FileDropzone
                  accept={{ 'application/pdf': ['.pdf'] }}
                  label="PDF" hint="Kéo thả file .pdf hoặc nhấn để chọn"
                  file={pdfFile} onDrop={setPdfFile} required
                />
              ) : (
                <input
                  type="url"
                  value={pdfUrlInput}
                  onChange={e => setPdfUrlInput(e.target.value)}
                  placeholder="https://[company]-my.sharepoint.com/..."
                  className={inputCls}
                />
              )}
            </div>

            {/* CAD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>File CAD (tùy chọn)</Label>
                <div className="flex gap-1 text-[10px]">
                  {(['upload','url'] as const).map(m => (
                    <button key={m} type="button"
                      onClick={() => setCadMode(m)}
                      className={`px-2 py-0.5 rounded border transition-colors
                        ${cadMode === m
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-zinc-500 border-zinc-300 hover:border-zinc-400'}`}>
                      {m === 'upload' ? 'Upload' : 'OneDrive'}
                    </button>
                  ))}
                </div>
              </div>
              {cadMode === 'upload' ? (
                <FileDropzone
                  accept={{ 'application/octet-stream': ['.dwg', '.dxf'] }}
                  label="CAD" hint=".dwg hoặc .dxf · Gói Cơ bản trở lên"
                  file={cadFile} onDrop={setCadFile}
                />
              ) : (
                <input
                  type="url"
                  value={cadUrlInput}
                  onChange={e => setCadUrlInput(e.target.value)}
                  placeholder="https://[company]-my.sharepoint.com/..."
                  className={inputCls}
                />
              )}
            </div>
          </div>
        </section>

        {/* ── 2. Ảnh bìa ─────────────────────────────────────── */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-zinc-800 mb-4">🖼️ Ảnh bìa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div
              {...getCoverProps()}
              className={`border-2 border-dashed rounded-lg cursor-pointer transition-colors
                aspect-[4/3] flex flex-col items-center justify-center
                ${isCoverDrag
                  ? 'border-blue-500 bg-blue-50'
                  : coverImage
                    ? 'border-green-400'
                    : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
                }`}
            >
              <input {...getCoverInput()} />
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="Preview"
                     className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center p-4">
                  <div className="text-3xl mb-2 opacity-40">🖼️</div>
                  <p className="text-xs text-zinc-500">Kéo thả ảnh bìa vào đây</p>
                  <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WebP · Nên 800×600px+</p>
                </div>
              )}
            </div>
            <div className="text-xs text-zinc-500 space-y-2">
              <p>💡 <strong>Tips ảnh bìa tốt:</strong></p>
              <ul className="space-y-1 ml-2">
                <li>• Phối cảnh 3D ngoại thất góc đẹp</li>
                <li>• Tỷ lệ 4:3 hoặc 16:9</li>
                <li>• Tối thiểu 800 × 600 px</li>
                <li>• Nền sáng, không watermark</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── 3. Thông tin cơ bản ────────────────────────────── */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-zinc-800 mb-4">📋 Thông tin cơ bản</h2>
          <div className="space-y-4">
            {/* Tiêu đề */}
            <div>
              <Label required>Tiêu đề bản vẽ</Label>
              <input
                type="text"
                value={tieuDe}
                onChange={e => setTieuDe(e.target.value)}
                placeholder="VD: Biệt thự 2 tầng hiện đại 8x15m - 4 phòng ngủ Hà Nội"
                className={inputCls}
              />
              <p className="text-xs text-zinc-400 mt-1">
                {tieuDe.length}/255 · Nên 50-80 ký tự, bao gồm loại, phong cách, kích thước
              </p>
            </div>

            {/* Loại CT + Phong cách */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label required>Loại công trình</Label>
                <select
                  value={loaiCt}
                  onChange={e => setLoaiCt(parseInt(e.target.value, 10))}
                  className={selectCls}
                >
                  {Object.entries(LOAI_CT).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.ten}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Phong cách chính</Label>
                <select
                  value={phongCach1}
                  onChange={e => setPhongCach1(parseInt(e.target.value, 10))}
                  className={selectCls}
                >
                  {Object.entries(PHONG_CACH).map(([k, v]) => (
                    <option key={k} value={k}>{v.ten}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Phong cách phụ</Label>
                <select
                  value={phongCach2 ?? ''}
                  onChange={e => setPhongCach2(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className={selectCls}
                >
                  <option value="">— Không có —</option>
                  {Object.entries(PHONG_CACH).map(([k, v]) => (
                    <option key={k} value={k}>{v.ten}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tỉnh + Gói tải */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required>Tỉnh / Thành phố thiết kế</Label>
                <select
                  value={tinhId}
                  onChange={e => setTinhId(parseInt(e.target.value, 10))}
                  className={selectCls}
                >
                  {Object.entries(TINH).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Gói tải</Label>
                <div className="flex gap-3 mt-1">
                  {[
                    { value: 'free',  label: 'FREE',    desc: 'PDF mặt bằng + khái toán'       },
                    { value: 'basic', label: 'CƠ BẢN',  desc: 'Hồ sơ đầy đủ + dự toán Excel' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex flex-col p-3 rounded-lg border cursor-pointer transition-colors
                        ${goiTai === opt.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-zinc-200 hover:border-zinc-300'}`}
                    >
                      <input
                        type="radio"
                        name="goi_tai"
                        value={opt.value}
                        checked={goiTai === opt.value}
                        onChange={() => setGoiTai(opt.value as 'free' | 'basic')}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-zinc-800">{opt.label}</span>
                      <span className="text-xs text-zinc-500 mt-0.5">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <Label>Mô tả</Label>
              <textarea
                value={moTa}
                onChange={e => setMoTa(e.target.value)}
                rows={4}
                placeholder="Mô tả chi tiết về bản vẽ, đặc điểm nổi bật, ưu điểm thiết kế..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Thẻ tag</Label>
              <input
                type="text"
                value={theTag}
                onChange={e => setTheTag(e.target.value)}
                placeholder="VD: mái thái, sân vườn, hồ bơi, tầng hầm"
                className={inputCls}
              />
              <p className="text-xs text-zinc-400 mt-1">Phân cách bởi dấu phẩy</p>
            </div>
          </div>
        </section>

        {/* ── 4. Chi tiết kỹ thuật ──────────────────────────── */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-zinc-800 mb-4">📐 Chi tiết kỹ thuật</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label>Chiều dài (m)</Label>
              <input type="number" min="1" max="200" step="0.1"
                value={chieuDai} onChange={e => setChieuDai(e.target.value)}
                placeholder="VD: 8.5" className={inputCls} />
            </div>
            <div>
              <Label>Chiều rộng (m)</Label>
              <input type="number" min="1" max="200" step="0.1"
                value={chieuRong} onChange={e => setChieuRong(e.target.value)}
                placeholder="VD: 15" className={inputCls} />
            </div>
            <div>
              <Label>Số tầng</Label>
              <input type="number" min="1" max="30" step="1"
                value={soTang} onChange={e => setSoTang(e.target.value)}
                placeholder="VD: 2" className={inputCls} />
            </div>
            <div>
              <Label>Diện tích sàn (m²)</Label>
              <input type="number" min="10" max="10000" step="0.5"
                value={dienTichSan} onChange={e => setDienTichSan(e.target.value)}
                placeholder="VD: 240" className={inputCls} />
            </div>
            <div>
              <Label>Số phòng ngủ</Label>
              <input type="number" min="0" max="20" step="1"
                value={soPhongNgu} onChange={e => setSoPhongNgu(e.target.value)}
                placeholder="VD: 4" className={inputCls} />
            </div>
          </div>
        </section>

        {/* ── 5. SEO ─────────────────────────────────────────── */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-zinc-800 mb-1">🔍 SEO</h2>
          <p className="text-xs text-zinc-400 mb-4">Tối ưu để Google tìm thấy bản vẽ này</p>
          <div className="space-y-4">
            <div>
              <Label>SEO Title</Label>
              <input
                type="text"
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                maxLength={70}
                placeholder={tieuDe ? `${tieuDe} — GiaXayNha.vn` : 'Để trống để dùng tiêu đề bản vẽ'}
                className={inputCls}
              />
              <p className="text-xs text-zinc-400 mt-1">
                {seoTitle.length}/70 ký tự · Tối ưu: 50–60 ký tự
              </p>
            </div>
            <div>
              <Label>SEO Description</Label>
              <textarea
                value={seoDesc}
                onChange={e => setSeoDesc(e.target.value)}
                maxLength={160}
                rows={2}
                placeholder="Mô tả ngắn hiện trên kết quả tìm kiếm Google..."
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-zinc-400 mt-1">
                {seoDesc.length}/160 ký tự · Tối ưu: 120–155 ký tự
              </p>
            </div>
            <div>
              <Label>Từ khóa SEO</Label>
              <input
                type="text"
                value={seoKeywords}
                onChange={e => setSeoKeywords(e.target.value)}
                placeholder="VD: biet thu 2 tang, biet thu hien dai, ban ve biet thu"
                className={inputCls}
              />
              <p className="text-xs text-zinc-400 mt-1">Phân cách bởi dấu phẩy · 5–10 từ khóa</p>
            </div>
          </div>
        </section>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
            ⚠️ {error}
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-8">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('nhap')}
            className="px-5 py-2.5 text-sm font-medium border border-zinc-300
                       text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors
                       disabled:opacity-50"
          >
            {submitting && uploadStep ? uploadStep : 'Lưu nháp'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('cho_duyet')}
            className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500
                       text-white rounded-lg transition-colors disabled:opacity-50
                       flex items-center gap-2"
          >
            {submitting
              ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />{uploadStep}</>
              : 'Gửi duyệt →'
            }
          </button>

          <Link href="/cms/ban-ve"
                className="text-sm text-zinc-400 hover:text-zinc-600 ml-auto">
            Hủy
          </Link>
        </div>
      </div>
    </div>
  )
}
