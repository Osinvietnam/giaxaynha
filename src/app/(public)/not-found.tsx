import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-lg font-semibold text-zinc-800 mb-1">Không tìm thấy trang</h1>
      <p className="text-sm text-zinc-500 mb-5 max-w-sm">
        Bản vẽ hoặc trang bạn tìm không tồn tại hoặc đã được chuyển.
      </p>
      <Link
        href="/thu-vien-ban-ve"
        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500
                   text-white rounded-lg transition-colors"
      >
        ← Về thư viện bản vẽ
      </Link>
    </div>
  )
}
