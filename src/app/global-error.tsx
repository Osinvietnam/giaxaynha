'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Hệ thống gặp sự cố</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>Vui lòng tải lại trang.</p>
        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#2563eb',
            color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
          }}
        >
          Tải lại
        </button>
      </body>
    </html>
  )
}
