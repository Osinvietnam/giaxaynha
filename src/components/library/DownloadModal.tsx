'use client'

import { useState } from 'react'
import { TINH, NHU_CAU_LABELS } from '@/lib/constants'
import type { NhuCauLead, SubmitLeadResponse } from '@/lib/types'

interface DownloadModalProps {
  banVeId: string
  tieuDe: string
  maGXN: string
  goiTai: 'free' | 'basic'
  onClose: () => void
}

type Step = 'form' | 'loading' | 'success' | 'error'

export function DownloadModal({ banVeId, tieuDe, maGXN, goiTai, onClose }: DownloadModalProps) {
  const [step, setStep]     = useState<Step>('form')
  const [sdt, setSdt]       = useState('')
  const [hoTen, setHoTen]   = useState('')
  const [tinhId, setTinhId] = useState<number | ''>('')
  const [nhuCau, setNhuCau] = useState<NhuCauLead | ''>('')
  const [result, setResult] = useState<SubmitLeadResponse | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [isRateLimit, setIsRateLimit] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sdt.trim()) return

    setStep('loading')
    setIsRateLimit(false)

    try {
      const res  = await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ban_ve_id:     banVeId,
          so_dien_thoai: sdt.trim(),
          ho_ten:        hoTen.trim() || undefined,
          tinh_id:       tinhId || undefined,
          nhu_cau:       nhuCau || undefined,
        }),
      })
      const data: SubmitLeadResponse = await res.json()

      if (!res.ok || !data.success) {
        setIsRateLimit(res.status === 429)
        setErrMsg(data.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.')
        setStep('error')
      } else {
        setResult(data)
        setStep('success')
      }
    } catch {
      setErrMsg('Không thể kết nối. Vui lòng kiểm tra lại mạng.')
      setStep('error')
    }
  }

  const expiresLabel = result?.expires_at
    ? new Date(result.expires_at).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-800">
              {step === 'success' ? 'Link tải đã sẵn sàng' : 'Nhận bản vẽ miễn phí'}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{maGXN}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors ml-4 mt-0.5"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>

        <div className="p-5">

          {/* ── Step: Form ── */}
          {step === 'form' && (
            <>
              <div className="bg-zinc-50 rounded-lg p-3 mb-5 border border-zinc-200">
                <p className="text-sm text-zinc-700 font-medium line-clamp-2">{tieuDe}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {goiTai === 'free'
                    ? '✅ Miễn phí — PDF mặt bằng + phối cảnh + khái toán'
                    : '📦 Gói Cơ bản — Hồ sơ KT+KC+ĐN + dự toán (PDF+Doc)'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase
                                   tracking-wider mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={sdt}
                    onChange={e => setSdt(e.target.value)}
                    required
                    placeholder="0912 345 678"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase
                                   tracking-wider mb-1.5">
                    Họ tên <span className="text-zinc-400 font-normal">(không bắt buộc)</span>
                  </label>
                  <input
                    type="text"
                    value={hoTen}
                    onChange={e => setHoTen(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase
                                   tracking-wider mb-1.5">
                    Tỉnh / Thành phố
                  </label>
                  <select
                    value={tinhId}
                    onChange={e => setTinhId(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">— Chọn tỉnh/thành —</option>
                    {Object.entries(TINH).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase
                                   tracking-wider mb-2">
                    Nhu cầu của bạn
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(NHU_CAU_LABELS) as [NhuCauLead, string][]).map(([k, v]) => (
                      <label
                        key={k}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer
                                   text-sm transition-colors
                                   ${nhuCau === k
                                     ? 'border-blue-500 bg-blue-50 text-blue-700'
                                     : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'}`}
                      >
                        <input
                          type="radio"
                          name="nhu_cau"
                          value={k}
                          checked={nhuCau === k}
                          onChange={() => setNhuCau(k)}
                          className="accent-blue-600"
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold
                             text-sm py-3 rounded-lg transition-colors"
                >
                  Nhận bản vẽ ngay →
                </button>

                <p className="text-center text-xs text-zinc-400">
                  Thông tin của bạn được bảo mật và không chia sẻ cho bên thứ ba
                </p>
              </form>
            </>
          )}

          {/* ── Step: Loading ── */}
          {step === 'loading' && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent
                              rounded-full animate-spin mb-4" />
              <p className="text-sm text-zinc-600">Đang tạo link tải...</p>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && result?.download_url && (
            <div>
              <div className="text-center mb-5">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-semibold text-zinc-800 mb-1">Link tải đã sẵn sàng!</h3>
                <p className="text-xs text-zinc-500">
                  Có hiệu lực đến: <strong>{expiresLabel}</strong>
                </p>
              </div>

              <a
                href={result.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 hover:bg-green-500 text-white text-center
                           font-semibold text-sm py-3 rounded-lg transition-colors mb-3"
              >
                📥 Tải bản vẽ ngay
              </a>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Lưu ý:</strong> Link hết hạn sau 24 giờ và tối đa 3 lượt tải.
                  Vui lòng lưu file về máy ngay sau khi tải.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-500 text-center">
                  Cần tư vấn thêm? Gọi ngay{' '}
                  <a href="tel:1900xxxx" className="text-blue-600 font-medium hover:underline">
                    1900 xxxx
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Error ── */}
          {step === 'error' && (
            <div className="text-center py-8">
              {isRateLimit ? (
                <>
                  <div className="text-4xl mb-3">⏳</div>
                  <p className="text-sm font-medium text-zinc-800 mb-1">
                    Đã đạt giới hạn tải hôm nay
                  </p>
                  <p className="text-xs text-zinc-500 mb-5 leading-relaxed">{errMsg}</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">❌</div>
                  <p className="text-sm font-medium text-zinc-800 mb-1">Có lỗi xảy ra</p>
                  <p className="text-xs text-zinc-500 mb-5">{errMsg}</p>
                  <button
                    onClick={() => setStep('form')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← Thử lại
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
