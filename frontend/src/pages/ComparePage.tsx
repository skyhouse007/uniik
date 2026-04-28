import { useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

/** Vite: files in `src/assets/compare/` (organic.jpg/png, etc.) are bundled and always resolve. */
const bundledCompare = import.meta.glob('../assets/compare/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function bundledUrlFor(id: string): string | undefined {
  const re = new RegExp(`[/\\\\]${id}\\.(jpg|jpeg|png|webp)$`, 'i')
  for (const [path, url] of Object.entries(bundledCompare)) {
    if (re.test(path)) return url
  }
  return undefined
}

function publicBase(): string {
  const b = import.meta.env.BASE_URL || '/'
  return b.endsWith('/') ? b : `${b}/`
}

/** Your photos: either `src/assets/compare/{organic|hybrid|ortho}.jpg` (recommended) or `public/images/compare/` same names. */
const LINES = [
  {
    id: 'organic',
    imageAlt: 'CozyFoam Organic mattress',
    name: 'Organic',
    tagline: 'Natural latex, head to toe',
    build: 'Full latex construction — natural latex layers throughout for consistent support and breathability.',
    feel: 'Medium soft',
    feelNote: 'Gentle contouring with a plush, buoyant sleep surface.',
  },
  {
    id: 'hybrid',
    imageAlt: 'CozyFoam Hybrid mattress',
    name: 'Hybrid',
    tagline: 'PU foam meets latex',
    build: 'PU foam core with latex comfort layers — responsive support with pressure relief.',
    feel: 'Medium firm',
    feelNote: 'Balanced: not too soft, not too hard — easy on the back for most sleepers.',
  },
  {
    id: 'ortho',
    imageAlt: 'CozyFoam Ortho mattress',
    name: 'Ortho',
    tagline: 'Bonded support + latex comfort',
    build: 'Bonded support layer with latex foam on top — structured base with cushioned comfort.',
    feel: 'Firm',
    feelNote: 'Firmer support for those who want a solid surface and strong spinal alignment.',
  },
] as const

/** 0 = softest … 4 = firmest (5 segments) */
function firmnessLastIndex(feel: string): number {
  if (feel.includes('Medium soft')) return 1
  if (feel.includes('Medium firm')) return 2
  if (feel === 'Firm' || (feel.includes('Firm') && !feel.includes('Medium'))) return 4
  return 2
}

const PUBLIC_EXT_FALLBACK = ['jpg', 'jpeg', 'png', 'webp'] as const

function CompareImage({ id, alt }: { id: string; alt: string }) {
  const bundled = useMemo(() => bundledUrlFor(id), [id])
  const [extIdx, setExtIdx] = useState(0)
  const [placeholder, setPlaceholder] = useState(false)

  const publicUrl = useCallback(
    (i: number) => `${publicBase()}images/compare/${id}.${PUBLIC_EXT_FALLBACK[i]}`,
    [id],
  )

  const onError = useCallback(() => {
    if (bundled) {
      setPlaceholder(true)
      return
    }
    setExtIdx((i) => {
      if (i < PUBLIC_EXT_FALLBACK.length - 1) return i + 1
      setTimeout(() => setPlaceholder(true), 0)
      return i
    })
  }, [bundled])

  const src = bundled ?? publicUrl(extIdx)

  if (placeholder) {
    return (
      <div
        className="flex h-full min-h-[120px] w-full items-center justify-center bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--border))]/40 text-center text-xs text-[rgb(var(--muted))]"
        aria-hidden
      >
        Image not found
      </div>
    )
  }

  return (
    <img
      key={bundled ? 'b' : extIdx}
      src={src}
      alt={alt}
      className="h-full w-full object-cover object-center"
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  )
}

function FirmnessBar({ lastIndex }: { lastIndex: number }) {
  const n = 5
  return (
    <div className="mt-3">
      <div className="flex gap-1">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className={[
              'h-2 flex-1 rounded-full transition',
              i <= lastIndex ? 'bg-[rgb(var(--brand))]' : 'bg-[rgb(var(--border))]',
            ].join(' ')}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
        <span>Soft</span>
        <span>Firm</span>
      </div>
    </div>
  )
}

export function ComparePage() {
  return (
    <div className="container-page py-8 md:py-12">
      <Helmet>
        <title>Compare mattresses — Organic, Hybrid & Ortho | CozyFoam</title>
        <meta
          name="description"
          content="Compare CozyFoam Organic (full latex, medium soft), Hybrid (PU foam + latex, medium firm), and Ortho (bonded + latex, firm)."
        />
      </Helmet>

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-[rgb(var(--brand))] md:text-3xl">
          Compare our mattresses
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
          Three builds — each tuned for different feel and support. Choose what matches your sleep style.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {LINES.map((line) => (
          <article
            key={line.id}
            className="flex flex-col overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--inverse))] shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[12/5] w-full shrink-0 bg-[rgb(var(--surface))]">
              <CompareImage id={line.id} alt={line.imageAlt} />
            </div>
            <div className="flex flex-1 flex-col p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--brand))]">
              {line.name}
            </div>
            <h2 className="mt-1 text-lg font-bold text-[rgb(var(--fg))]">{line.tagline}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[rgb(var(--muted))]">{line.build}</p>
            <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Typical feel
              </div>
              <div className="mt-0.5 text-base font-bold text-[rgb(var(--brand))]">{line.feel}</div>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{line.feelNote}</p>
              <FirmnessBar lastIndex={firmnessLastIndex(line.feel)} />
            </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-5 py-4 text-center text-sm text-[rgb(var(--muted))]">
        Not sure which to pick?{' '}
        <Link to="/products" className="font-semibold text-[rgb(var(--brand))] underline-offset-2 hover:underline">
          Browse all mattresses
        </Link>{' '}
        or contact us for a recommendation.
      </div>
    </div>
  )
}
