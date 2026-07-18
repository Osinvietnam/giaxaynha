import { createServerClient } from '@supabase/ssr'

// Client anon KHÔNG dùng cookies → trang public không phụ thuộc request,
// cho phép cache/ISR (Đợt 3 task 3.1). Chỉ dùng cho đọc dữ liệu công khai.
export function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
