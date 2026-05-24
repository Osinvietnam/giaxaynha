'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CMSLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email hoặc mật khẩu không đúng')
      setLoading(false)
      return
    }

    router.push('/cms')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-content-center">
      <div className="w-full max-w-sm mx-auto mt-24">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-zinc-100 tracking-tight">
            Gia<span className="text-blue-500">Xay</span>Nha
            <span className="text-sm text-zinc-500 font-normal">.vn</span>
          </div>
          <div className="text-xs text-zinc-600 mt-1 font-medium uppercase tracking-widest">
            CMS — Nội bộ
          </div>
        </div>

        {/* Form */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
          <div className="text-sm font-semibold text-zinc-200 mb-5">Đăng nhập</div>

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-xs rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="ten@giaxaynha.vn"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm
                           text-zinc-100 placeholder:text-zinc-600
                           focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm
                           text-zinc-100 placeholder:text-zinc-600
                           focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                         text-white font-medium text-sm py-2.5 rounded transition-colors"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-4">
          Chỉ dành cho nhân sự GiaXayNha.vn được cấp quyền
        </p>
      </div>
    </div>
  )
}
