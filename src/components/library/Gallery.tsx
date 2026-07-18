'use client'

import { useState } from 'react'

interface GalleryProps {
  images: string[]
  alt: string
  fallbackEmoji?: string
}

// Gallery tương tác: bấm/di phím mũi tên để đổi ảnh chính (task 1.11)
export function Gallery({ images, alt, fallbackEmoji = '🏠' }: GalleryProps) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-zinc-100 rounded-xl overflow-hidden mb-3
                      flex flex-col items-center justify-center gap-3">
        <span className="text-6xl opacity-30">{fallbackEmoji}</span>
        <span className="text-sm text-zinc-400">Chưa có ảnh phối cảnh</span>
      </div>
    )
  }

  function move(delta: number) {
    setActive(i => (i + delta + images.length) % images.length)
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); move(-1) }
        if (e.key === 'ArrowRight') { e.preventDefault(); move(1) }
      }}
      aria-roledescription="carousel"
      className="outline-none"
    >
      {/* Ảnh chính */}
      <div className="aspect-[4/3] bg-zinc-100 rounded-xl overflow-hidden mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={`${alt} — ảnh ${active + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Xem ảnh ${i + 1}`}
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all
                ${i === active ? 'border-blue-500' : 'border-transparent hover:border-zinc-300'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${alt} - ${i + 1}`} className="w-20 h-14 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
