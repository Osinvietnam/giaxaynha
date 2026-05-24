import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Layout cho toàn bộ /cms — middleware đã chặn unauthenticated
// Layout này lấy thêm thông tin user để hiển thị nav
export default async function CMSLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Double-check (middleware đã xử lý nhưng để an toàn)
  if (!user) redirect('/cms/login')

  const role = user.user_metadata?.role as string ?? 'unknown'
  const displayName = user.user_metadata?.full_name ?? user.email ?? ''
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* CMS Top Nav */}
      <nav className="bg-zinc-900 border-b border-zinc-800 px-7 flex items-center h-12 sticky top-0 z-50">
        {/* Logo */}
        <div className="text-sm font-bold text-zinc-200 tracking-tight">
          Gia<span className="text-blue-500">Xay</span>Nha
          <span className="ml-2 text-xs text-zinc-600 font-normal bg-zinc-800
                           px-2 py-0.5 rounded-full border border-zinc-700">
            CMS
          </span>
        </div>

        {/* Nav links */}
        <div className="ml-6 flex gap-1">
          <a href="/cms"          className="cms-nav-link">Dashboard</a>
          <a href="/cms/ban-ve"   className="cms-nav-link">Bản vẽ</a>
          <a href="/cms/leads"    className="cms-nav-link">Leads</a>
          {role === 'quan_ly' && (
            <>
              <a href="/cms/don-hang" className="cms-nav-link">Đơn hàng</a>
              <a href="/cms/cai-dat"  className="cms-nav-link">Cài đặt</a>
            </>
          )}
        </div>

        {/* User info */}
        <div className="ml-auto flex items-center gap-2.5">
          <span className="text-xs text-zinc-500">{displayName}</span>
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center
                          text-xs font-bold text-white">
            {initial}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
