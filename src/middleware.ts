import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Fail-closed (task 0.9): thiếu env → CHẶN /cms thay vì cho qua.
  // Trang /cms/login vẫn cho vào để hiển thị thông báo lỗi cấu hình.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (
      request.nextUrl.pathname.startsWith('/cms') &&
      !request.nextUrl.pathname.startsWith('/cms/login')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/cms/login'
      url.searchParams.set('error', 'config_missing')
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Bọc trong try-catch để tránh crash khi Supabase không kết nối được
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Không kết nối được Supabase → coi như chưa đăng nhập
    // /cms/login vẫn accessible, các trang khác trong /cms bị chặn
  }

  // Bảo vệ toàn bộ /cms — redirect về /cms/login nếu chưa đăng nhập
  if (
    request.nextUrl.pathname.startsWith('/cms') &&
    !request.nextUrl.pathname.startsWith('/cms/login') &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/cms/login'
    return NextResponse.redirect(url)
  }

  // Nếu đã đăng nhập và vào /cms/login → redirect về /cms
  if (request.nextUrl.pathname === '/cms/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/cms'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/cms/:path*'],
}
