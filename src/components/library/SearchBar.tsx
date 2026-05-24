'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchBar({ initialQ = '' }: { initialQ?: string }) {
  const router  = useRouter()
  const [q, setQ] = useState(initialQ)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    router.push(`/thu-vien-ban-ve?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl mx-auto w-full">
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Tìm bản vẽ: biệt thự hiện đại, nhà phố 3 tầng..."
        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100
                   placeholder:text-zinc-500 text-sm rounded-lg px-4 py-3
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold
                   px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
      >
        Tìm kiếm
      </button>
    </form>
  )
}
