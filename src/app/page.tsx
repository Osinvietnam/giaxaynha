import { redirect } from 'next/navigation'

// Trang chủ tạm: redirect về thư viện bản vẽ
// Phase 2 sẽ có homepage riêng với Quick Estimate (S1)
export default function HomePage() {
  redirect('/thu-vien-ban-ve')
}
