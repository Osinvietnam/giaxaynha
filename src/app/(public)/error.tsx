'use client'

import Link from 'next/link'

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-lg font-semibold text-zinc-800 mb-1">Có lỗi xảy ra</h1>
      <p className="text-sm text-zinc-500 mb-5 max-w-sm">
        Xin lỗi vì sự cố. Vui lòng thử lại hoặc quay về thư viện.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500
                     text-white rounded-lg transition-colors"
        >
          Thử lại
        </button>
        <Link
          href="/thu-vien-ban-ve"
          className="px-4 py-2 text-sm border border-zinc-300 rounded-lg
                     hover:bg-zinc-50 text-zinc-600 transition-colors"
        >
          Về thư viện
        </Link>
      </div>
    </div>
  )
}
