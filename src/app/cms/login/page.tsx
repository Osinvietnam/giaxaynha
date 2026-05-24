'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [mode, setMode]           = useState<'password' | 'magic'>('password')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)
  const router    = useRouter()
  const params    = useSearchParams()
  const linkError = params.get('error')

  async function handlePassword(e: React.FormEvent) {
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

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Không thể gửi link. Kiểm tra lại email.')
      setLoading(false)
      return
    }
    setMagicSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto px-4">
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

        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 bg-zinc-900 rounded p-1">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(null); setMagicSent(false) }}
              className={`flex-1 text-xs font-medium py-1.5 rounded transition-colors
                ${mode === 'password'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Mật khẩu
            </button>
            <button
              type="button"
              onClick={() => { setMode('magic'); setError(null); setMagicSent(false) }}
              className={`flex-1 text-xs font-medium py-1.5 rounded transition-colors
                ${mode === 'magic'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Magic link
            </button>
          </div>

          {/* Lỗi link hết hạn */}
          {linkError === 'link_invalid' && (
            <div className="bg-amber-950 border border-amber-800 text-amber-400 text-xs rounded p-3 mb-4">
              Link đã hết hạn. Vui lòng gửi lại magic link.
            </div>
          )}

          {/* Lỗi form */}
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-xs rounded p-3 mb-4">
              {error}
            </div>
          )}

          {/* Magic link — đã gửi */}
          {mode === 'magic' && magicSent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📬</div>
              <p className="text-zinc-200 text-sm font-medium">Kiểm tra email của bạn</p>
              <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                Link đăng nhập đã được gửi tới <span className="text-zinc-300">{email}</span>.
                <br />Link có hiệu lực trong 1 giờ.
              </p>
              <button
                type="button"
                onClick={() => setMagicSent(false)}
                className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Gửi lại
              </button>
            </div>
          ) : mode === 'magic' ? (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="osinvietnam@gmail.com"
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
                {loading ? 'Đang gửi...' : 'Gửi magic link →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="flex flex-col gap-4">
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
          )}
        </div>

        <p className="text-center text-xs text-zinc-700 mt-4">
          Chỉ dành cho nhân sự GiaXayNha.vn được cấp quyền
        </p>
      </div>
    </div>
  )
}

export default function CMSLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
