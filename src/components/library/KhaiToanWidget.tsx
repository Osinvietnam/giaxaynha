'use client'

import { useState, useMemo } from 'react'
import {
  DON_GIA, MAI_LABEL, tinhKhaiToan, formatVND,
  type CapHoanThien, type LoaiMai,
} from '@/lib/estimate'
import { DownloadGate } from './DownloadGate'

interface Props {
  banVeId: string
  tieuDe: string
  maGXN: string
  goiTai: 'free' | 'basic'
  dt1San: number
  soTang: number
  tinhId: number | null
  loaiMai?: LoaiMai
  coHam?: boolean
}

export function KhaiToanWidget({
  banVeId, tieuDe, maGXN, goiTai,
  dt1San: dt1SanInit, soTang: soTangInit, tinhId, loaiMai: maiInit, coHam: hamInit,
}: Props) {
  const [dt1San, setDt1San]       = useState(Math.max(20, Math.round(dt1SanInit || 80)))
  const [soTang, setSoTang]       = useState(Math.max(1, soTangInit || 2))
  const [cap, setCap]             = useState<CapHoanThien>('co_ban')
  const [mai, setMai]             = useState<LoaiMai>(maiInit ?? 'thai')
  const [coHam, setCoHam]         = useState<boolean>(hamInit ?? false)

  const kq = useMemo(
    () => tinhKhaiToan({ dt1San, soTang, loaiMai: mai, coHam, capHoanThien: cap, tinhId }),
    [dt1San, soTang, mai, coHam, cap, tinhId]
  )

  const inputCls = 'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white'

  return (
    <div className="bg-white rounded-xl border-2 border-blue-100 overflow-hidden mb-4">
      <div className="bg-blue-600 px-4 py-2.5">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          🧮 Ước tính chi phí xây dựng
        </h3>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Diện tích 1 sàn (m²)</span>
            <input type="number" min={20} max={2000} value={dt1San}
                   onChange={e => setDt1San(Math.max(0, parseInt(e.target.value || '0', 10)))}
                   className={inputCls} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Số tầng</span>
            <input type="number" min={1} max={30} value={soTang}
                   onChange={e => setSoTang(Math.max(1, parseInt(e.target.value || '1', 10)))}
                   className={inputCls} />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Cấp hoàn thiện</span>
          <select value={cap} onChange={e => setCap(e.target.value as CapHoanThien)} className={inputCls}>
            {(Object.entries(DON_GIA) as [CapHoanThien, { label: string }][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3 items-end">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Loại mái</span>
            <select value={mai} onChange={e => setMai(e.target.value as LoaiMai)} className={inputCls}>
              {(Object.entries(MAI_LABEL) as [LoaiMai, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2 cursor-pointer">
            <input type="checkbox" checked={coHam} onChange={e => setCoHam(e.target.checked)}
                   className="accent-blue-600 w-4 h-4" />
            <span className="text-sm text-zinc-600">Có tầng hầm</span>
          </label>
        </div>

        {/* Kết quả */}
        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
          <p className="text-xs text-zinc-500 mb-1">Khái toán chi phí (tham khảo)</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatVND(kq.min)} – {formatVND(kq.max)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            DT xây dựng quy đổi ~{kq.dtxd.toLocaleString('vi-VN')} m²
          </p>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          * Khái toán phần xây dựng, chưa gồm nội thất rời, thiết bị, sân vườn đặc biệt.
          Con số chính xác cần khảo sát lô đất thực tế.
        </p>

        <DownloadGate
          banVeId={banVeId}
          tieuDe={tieuDe}
          maGXN={maGXN}
          goiTai={goiTai}
          label="📋 Nhận dự toán chi tiết theo lô đất"
          estimate={{
            khai_toan_min: kq.min,
            khai_toan_max: kq.max,
            muc_hoan_thien: cap,
            dt_lo_dat: dt1San,
          }}
        />
      </div>
    </div>
  )
}
