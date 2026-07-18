'use client'

import { useState, useEffect } from 'react'

// Bottom-sheet lọc cho mobile (task 4.5). Server truyền FilterControls làm children.
export function MobileFilterSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-zinc-300 rounded-lg
                   px-3 py-2 text-sm text-zinc-700 bg-white hover:bg-zinc-50"
      >
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
        </svg>
        Bộ lọc
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          role="dialog"
          aria-modal="true"
          aria-label="Bộ lọc bản vẽ"
        >
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl
                          max-h-[85vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-800">Bộ lọc</h2>
              <button onClick={() => setOpen(false)} aria-label="Đóng"
                      className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
            </div>
            {children}
            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold
                         text-sm py-3 rounded-lg transition-colors"
            >
              Xem kết quả
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
