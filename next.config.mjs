/** @type {import('next').NextConfig} */

// Security headers (Đợt 0 — task 0.8)
// CSP giữ ở mức an toàn: chặn nhúng iframe + object, không siết script-src
// để tránh vỡ Next.js (inline scripts). Có thể siết chặt hơn ở Đợt sau.
const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
]

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    // Cho phép next/image tối ưu ảnh từ Supabase Storage (dùng ở Đợt 2)
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/**' },
    ],
  },
}

export default nextConfig
