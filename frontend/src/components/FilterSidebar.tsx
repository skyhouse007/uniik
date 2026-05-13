import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function toNum(s: string | null) {
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

export function FilterSidebar() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const state = useMemo(() => {
    return {
      minPrice: toNum(params.get('minPrice')),
      maxPrice: toNum(params.get('maxPrice')),
      size: params.get('size') ?? '',
      firmness: params.get('firmness') ?? '',
      brand: params.get('brand') ?? '',
      minRating: toNum(params.get('minRating')) ?? 0,
    }
  }, [params])

  function update(next: Partial<typeof state>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === null || v === '' || v === 0) p.delete(k)
      else p.set(k, String(v))
    }
    p.set('page', '1')
    navigate({ pathname: '/products', search: p.toString() })
  }

  return (
    <aside className="rounded-2xl border border-white/12 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
      <div className="text-sm font-semibold text-[rgb(var(--fg))]">Filters</div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Price</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              value={state.minPrice ?? ''}
              onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Min"
              className="rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45"
              inputMode="numeric"
            />
            <input
              value={state.maxPrice ?? ''}
              onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Max"
              className="rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Size (variant)</div>
          <input
            value={state.size}
            onChange={(e) => update({ size: e.target.value })}
            placeholder="e.g. 72x60"
            className="mt-2 w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Firmness</div>
          <select
            value={state.firmness}
            onChange={(e) => update({ firmness: e.target.value })}
            className="mt-2 w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white/45"
          >
            <option value="">Any</option>
            <option value="soft">Soft</option>
            <option value="medium">Medium</option>
            <option value="firm">Firm</option>
          </select>
        </div>

        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Brand</div>
          <input
            value={state.brand}
            onChange={(e) => update({ brand: e.target.value })}
            placeholder="e.g. Uniik"
            className="mt-2 w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Rating</div>
          <select
            value={String(state.minRating ?? 0)}
            onChange={(e) => update({ minRating: Number(e.target.value) })}
            className="mt-2 w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white/45"
          >
            <option value="0">Any</option>
            <option value="3">3★ & up</option>
            <option value="4">4★ & up</option>
            <option value="4.5">4.5★ & up</option>
          </select>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
        >
          Clear all
        </button>
      </div>
    </aside>
  )
}

