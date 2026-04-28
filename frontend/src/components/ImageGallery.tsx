import { useMemo, useState } from 'react'

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const safeImages = useMemo(() => images?.filter(Boolean) ?? [], [images])
  const [active, setActive] = useState(0)
  const activeSrc = safeImages[active]

  return (
    <div className="grid gap-3">
      <div className="aspect-square overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        {activeSrc ? (
          <img src={activeSrc} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-[rgb(var(--muted))]">No image</div>
        )}
      </div>
      {safeImages.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {safeImages.slice(0, 10).map((src, idx) => (
            <button
              key={src + idx}
              onClick={() => setActive(idx)}
              className={[
                'aspect-square overflow-hidden rounded-xl border bg-[rgb(var(--surface))]',
                idx === active ? 'border-[rgb(var(--brand))]' : 'border-[rgb(var(--border))]',
              ].join(' ')}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

