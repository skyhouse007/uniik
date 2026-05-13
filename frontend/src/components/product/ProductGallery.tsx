import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { productPrimaryImage } from '../../utils/product'
import type { Product } from '../../types/catalog'

type Props = {
  product: Product
}

export function ProductGallery({ product }: Props) {
  const baseUrl = useMemo(() => {
    const b = import.meta.env.BASE_URL || '/'
    return b.endsWith('/') ? b : `${b}/`
  }, [])

  const normalizeUrl = useCallback(
    (raw: unknown) => {
      // Cloudinary / upload widgets sometimes store objects like { secure_url, url }.
      // Also guard against accidentally persisted "[object Object]" strings.
      const candidate =
        raw && typeof raw === 'object'
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (raw as any).secure_url ?? (raw as any).url ?? ''
          : raw

      const s = String(candidate ?? '').trim()
      if (!s) return ''
      if (s === '[object Object]') return ''
      if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:')) return s
      if (s.startsWith('/')) return s
      return `${baseUrl}${s.replace(/^\.?\//, '')}`
    },
    [baseUrl],
  )

  const images = useMemo(() => {
    // tolerate: string[], (string|object)[], or a single string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = (product as any).images
    const arr: unknown[] = Array.isArray(raw) ? raw : raw ? [raw] : []
    return arr.map(normalizeUrl).filter(Boolean)
  }, [normalizeUrl, product])
  const fallback = productPrimaryImage(product)
  const list = images.length ? images : fallback ? [normalizeUrl(fallback)] : []
  const [active, setActive] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)
  const activeSrc = list[active]
  const touchStartX = useRef<number | null>(null)
  const [broken, setBroken] = useState<Record<string, true>>({})

  useEffect(() => {
    setFadeIn(false)
    const id = requestAnimationFrame(() => setFadeIn(true))
    return () => cancelAnimationFrame(id)
  }, [activeSrc])

  useEffect(() => {
    setActive(0)
    setBroken({})
  }, [product._id])

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setZoomOpen(false)
  }, [])

  const badges = useMemo(() => {
    const out: string[] = []
    const promo = String(product.promoBadgeText ?? '').trim()
    if (promo) out.push(promo)

    const name = String(product.productName ?? '').toLowerCase()
    const desc = String(product.shortDescription ?? '').toLowerCase()
    const hay = `${name} ${desc}`
    if (hay.includes('latex')) out.push('Natural Latex')
    if (hay.includes('organic')) out.push('Organic Fabric')
    return Array.from(new Set(out)).slice(0, 3)
  }, [product.productName, product.shortDescription, product.promoBadgeText])

  const go = useCallback(
    (idx: number) => {
      if (!list.length) return
      const next = Math.max(0, Math.min(idx, list.length - 1))
      setActive(next)
    },
    [list.length],
  )

  const markBroken = useCallback((src: string) => {
    const s = String(src ?? '').trim()
    if (!s) return
    setBroken((b) => (b[s] ? b : { ...b, [s]: true }))
  }, [])

  const safeActiveSrc = activeSrc && !broken[activeSrc] ? activeSrc : ''

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const x = e.touches?.[0]?.clientX
    touchStartX.current = typeof x === 'number' ? x : null
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartX.current
      touchStartX.current = null
      if (start == null) return
      const end = e.changedTouches?.[0]?.clientX
      if (typeof end !== 'number') return
      const dx = end - start
      if (Math.abs(dx) < 40) return
      if (dx < 0) go(active + 1)
      else go(active - 1)
    },
    [active, go],
  )

  const hasThumbRail = list.length > 1

  return (
    <div
      className={[
        'grid w-full gap-4',
        hasThumbRail ? 'md:grid-cols-[88px_minmax(0,1fr)] md:items-start' : '',
      ].join(' ')}
    >
      {/* Desktop: vertical thumbnails on left */}
      {list.length > 1 ? (
        <div className="hidden max-h-[680px] gap-3 overflow-auto pr-1 md:grid">
          {list.slice(0, 10).map((src, idx) => (
            <button
              key={src + idx}
              type="button"
              onClick={() => go(idx)}
              className={[
                'group relative aspect-square overflow-hidden rounded-2xl border bg-black/50 shadow-sm transition',
                'hover:-translate-y-0.5 hover:shadow-md',
                idx === active
                  ? 'border-white ring-1 ring-white'
                  : 'border-white/15 hover:border-white/35',
              ].join(' ')}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={src}
                alt=""
                className={['h-full w-full object-cover', broken[src] ? 'opacity-40' : 'opacity-100'].join(' ')}
                loading="lazy"
                draggable={false}
                onError={() => markBroken(src)}
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid w-full gap-3">
        <button
          type="button"
          onClick={() => activeSrc && setZoomOpen(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="group relative w-full aspect-square overflow-hidden rounded-3xl border border-white/12 bg-black/40 shadow-[0_22px_60px_rgba(0,0,0,0.45)] text-left outline-none ring-white focus-visible:ring-2 md:rounded-[30px]"
          aria-label="Open image zoom"
        >
          {safeActiveSrc ? (
            <img
              key={safeActiveSrc}
              src={safeActiveSrc}
              alt={product.productName}
              className={[
                'h-full w-full object-cover object-center',
                'transition-[opacity,transform] duration-300 ease-out',
                fadeIn ? 'opacity-100' : 'opacity-0',
                'will-change-transform',
                'group-hover:scale-[1.07]',
              ].join(' ')}
              draggable={false}
              onError={() => markBroken(safeActiveSrc)}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-[rgb(var(--muted))]">No image</div>
          )}

          {badges.length ? (
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-white/25 bg-black/55 px-3 py-1 text-[11px] font-semibold tracking-[0.02em] text-white shadow-sm backdrop-blur-sm"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : null}

          <span className="pointer-events-none absolute bottom-5 right-5 rounded-full bg-black/50 px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
            Hover to zoom • Tap to expand
          </span>
        </button>

        {/* Mobile: horizontal thumbnails below */}
        {list.length > 1 ? (
          <div className="-mx-4 mt-1 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
            {list.slice(0, 10).map((src, idx) => (
              <button
                key={src + idx}
                type="button"
                onClick={() => go(idx)}
                className={[
                  'group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-black/50 shadow-sm transition',
                  'hover:-translate-y-0.5 hover:shadow-md',
                  idx === active
                    ? 'border-white ring-1 ring-white'
                    : 'border-white/15 hover:border-white/35',
                ].join(' ')}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={src}
                  alt=""
                  className={['h-full w-full object-cover', broken[src] ? 'opacity-40' : 'opacity-100'].join(' ')}
                  loading="lazy"
                  draggable={false}
                  onError={() => markBroken(src)}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {zoomOpen && safeActiveSrc ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          onClick={() => setZoomOpen(false)}
          onKeyDown={onKey}
          tabIndex={-1}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            onClick={() => setZoomOpen(false)}
          >
            Close
          </button>
          <img
            src={safeActiveSrc}
            alt={product.productName}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={() => markBroken(safeActiveSrc)}
          />
        </div>
      ) : null}
    </div>
  )
}
