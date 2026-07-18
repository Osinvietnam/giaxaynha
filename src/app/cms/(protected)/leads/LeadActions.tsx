'use client'

import { useState, useTransition } from 'react'
import { updateLeadStatus } from './actions'

const STATUS_OPTIONS = [
  { v: 'cho_goi',    l: 'Chờ gọi' },
  { v: 'dang_tuvan', l: 'Đang tư vấn' },
  { v: 'da_chot',    l: 'Đã chốt' },
  { v: 'khong_dt',   l: 'Không bắt được' },
]

export function LeadActions({
  id, sdt, status: initial, ghiChu,
}: {
  id: string
  sdt: string
  status: string
  ghiChu: string | null
}) {
  const [status, setStatus] = useState(initial)
  const [note, setNote]     = useState(ghiChu ?? '')
  const [pending, start]    = useTransition()
  const [saved, setSaved]   = useState(false)

  function save(nextStatus: string, nextNote: string) {
    start(async () => {
      const res = await updateLeadStatus(id, nextStatus, nextNote)
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 1500) }
    })
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {saved && <span className="text-[10px] text-green-600">✓ Đã lưu</span>}

      <select
        value={status}
        disabled={pending}
        onChange={e => { setStatus(e.target.value); save(e.target.value, note) }}
        aria-label="Đổi trạng thái lead"
        className="text-xs border border-zinc-300 rounded px-1.5 py-1 bg-white
                   focus:outline-none focus:border-blue-400 disabled:opacity-50"
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>

      <button
        type="button"
        title="Ghi chú cuộc gọi"
        disabled={pending}
        onClick={() => {
          const input = window.prompt('Ghi chú cuộc gọi / kết quả tư vấn:', note)
          if (input !== null) { setNote(input); save(status, input) }
        }}
        className="text-xs border border-zinc-300 rounded px-1.5 py-1 bg-white
                   hover:bg-zinc-50 disabled:opacity-50"
      >
        ✎
      </button>

      <a
        href={`tel:${sdt}`}
        className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700
                   border border-blue-200 px-2 py-1 rounded hover:bg-blue-100
                   transition-colors font-medium"
      >
        📞 Gọi
      </a>
    </div>
  )
}
