import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Xử lý PKCE code exchange cho magic link, password recovery, invite
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Chống open redirect (task 0.7): chỉ nhận path nội bộ, không nhận //host hay @host
  const rawNext = searchParams.get('next') ?? '/cms'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/cms'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Link hết hạn hoặc code không hợp lệ
  return NextResponse.redirect(`${origin}/cms/login?error=link_invalid`)
}
