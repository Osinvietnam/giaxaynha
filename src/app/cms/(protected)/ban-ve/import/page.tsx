'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any> & { excelRow: number; ma_gxn: string; tieu_de: string; errors: string[] }

export default function ImportBanVePage() {
  const router = useRouter()
  const [parsing, setParsing]   = useState(false)
  const [committing, setCommit] = useState(false)
  const [rows, setRows]         = useState<Row[] | null>(null)
  const [summary, setSummary]   = useState<{ total: number; valid: number } | null>(null)
  const [result, setResult]     = useState<{ inserted: number; failed: { ma_gxn: string; error: string }[] } | null>(null)
  const [error, setError]       = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setResult(null); setRows(null); setParsing(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/cms/import-ban-ve/parse', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Lỗi đọc file'); return }
      setRows(data.rows); setSummary({ total: data.total, valid: data.valid })
    } catch { setError('Không kết nối được máy chủ') }
    finally { setParsing(false) }
  }

  async function commit() {
    if (!rows) return
    const valid = rows.filter(r => r.errors.length === 0)
    if (valid.length === 0) return
    setCommit(true); setError('')
    try {
      const res = await fetch('/api/cms/import-ban-ve/commit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: valid }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Lỗi import'); return }
      setResult(data)
    } catch { setError('Không kết nối được máy chủ') }
    finally { setCommit(false) }
  }

  const validCount = rows?.filter(r => r.errors.length === 0).length ?? 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/cms/ban-ve" className="text-zinc-400 hover:text-zinc-600">← Quay lại</Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">Import bản vẽ từ Excel</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Tải file theo mẫu, xem trước rồi xác nhận</p>
        </div>
        <a href="/templates/ban-ve-template.xlsx" download
           className="ml-auto text-sm text-blue-600 hover:underline">⬇ Tải file mẫu</a>
      </div>

      {/* Upload */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-zinc-700 mb-2">Chọn file Excel (.xlsx)</label>
        <input type="file" accept=".xlsx" onChange={onFile} disabled={parsing || committing}
               className="block text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg
                          file:border-0 file:bg-blue-600 file:text-white file:text-sm file:font-medium
                          hover:file:bg-blue-500 file:cursor-pointer" />
        {parsing && <p className="text-sm text-zinc-500 mt-3">Đang đọc file...</p>}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 mb-6">⚠️ {error}</div>}

      {/* Kết quả import */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <p className="text-green-800 font-semibold mb-2">✅ Đã import {result.inserted} bản vẽ</p>
          {result.failed.length > 0 && (
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">{result.failed.length} dòng lỗi:</p>
              <ul className="list-disc ml-5 space-y-0.5">
                {result.failed.map((f, i) => <li key={i}>{f.ma_gxn}: {f.error}</li>)}
              </ul>
            </div>
          )}
          <button onClick={() => router.push('/cms/ban-ve')}
                  className="mt-4 text-sm text-blue-600 hover:underline">Xem danh sách bản vẽ →</button>
        </div>
      )}

      {/* Xem trước */}
      {rows && !result && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm text-zinc-600">
              Tổng <strong>{summary?.total}</strong> dòng ·
              <span className="text-green-600 font-medium"> {validCount} hợp lệ</span>
              {summary && summary.total - validCount > 0 &&
                <span className="text-red-600 font-medium"> · {summary.total - validCount} lỗi</span>}
            </p>
            <button onClick={commit} disabled={committing || validCount === 0}
                    className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold
                               px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {committing ? 'Đang import...' : `Import ${validCount} bản vẽ hợp lệ →`}
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="text-left px-3 py-2">Dòng</th>
                  <th className="text-left px-3 py-2">Mã GXN</th>
                  <th className="text-left px-3 py-2">Tiêu đề</th>
                  <th className="text-left px-3 py-2">Loại</th>
                  <th className="text-left px-3 py-2">Gói</th>
                  <th className="text-left px-3 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.excelRow} className={r.errors.length ? 'bg-red-50/50' : ''}>
                    <td className="px-3 py-2 text-zinc-400">{r.excelRow}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">{r.ma_gxn || '—'}</td>
                    <td className="px-3 py-2">
                      {r.tieu_de}
                      {r.errors.length > 0 && (
                        <span className="block text-red-600 mt-0.5">⚠ {r.errors.join('; ')}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">{r.loai_ct ?? '—'}</td>
                    <td className="px-3 py-2 text-zinc-500">{r.goi_tai}</td>
                    <td className="px-3 py-2 text-zinc-500">{r.trang_thai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
