import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'GiaXayNha.vn — Thư viện bản vẽ xây dựng',
    template: '%s | GiaXayNha.vn',
  },
  description: 'Tải miễn phí 350+ bản vẽ xây dựng: biệt thự, nhà phố, văn phòng. File CAD + PDF chất lượng cao.',
  keywords: ['bản vẽ xây dựng', 'thiết kế biệt thự', 'bản vẽ nhà phố', 'autocad nhà ở'],
  openGraph: {
    siteName: 'GiaXayNha.vn',
    locale: 'vi_VN',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
