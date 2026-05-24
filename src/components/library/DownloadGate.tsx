'use client'

import { useState } from 'react'
import { DownloadModal } from './DownloadModal'

interface DownloadGateProps {
  banVeId: string
  tieuDe: string
  maGXN: string
  goiTai: 'free' | 'basic'
}

export function DownloadGate({ banVeId, tieuDe, maGXN, goiTai }: DownloadGateProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold
                   text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        {goiTai === 'free' ? 'Tải miễn phí' : 'Tải bản vẽ'}
      </button>

      {open && (
        <DownloadModal
          banVeId={banVeId}
          tieuDe={tieuDe}
          maGXN={maGXN}
          goiTai={goiTai}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
