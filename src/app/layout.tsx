import type { Metadata } from 'next'
import './globals.css'
import { BASE_URL, SITE } from '@/lib/site'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
    url: BASE_URL,
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {/* Structured data toàn site (task 2.5) */}
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE.name,
          url: BASE_URL,
          telephone: SITE.hotlineTel,
        }} />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE.name,
          url: BASE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${BASE_URL}/thu-vien-ban-ve?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }} />
        {children}
      </body>
    </html>
  )
}
