'use client'

import { useEffect } from 'react'

// Đếm lượt xem phía client (task 3.3) — tách khỏi render để trang chi tiết
// cache/ISR được. Chỉ đếm 1 lần / phiên / bản vẽ.
export function ViewBeacon({ banVeId }: { banVeId: string }) {
  useEffect(() => {
    const key = `viewed:${banVeId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch { /* sessionStorage bị chặn — vẫn gửi */ }
    fetch(`/api/view/${banVeId}`, { method: 'POST', keepalive: true }).catch(() => {})
  }, [banVeId])

  return null
}
