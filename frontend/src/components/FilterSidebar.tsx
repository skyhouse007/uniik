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
    <aside className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">Filters</div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Price</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              value={state.minPrice ?? ''}
              onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Min"
              className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
              inputMode="numeric"
            />
            <input
              value={state.maxPrice ?? ''}
              onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Max"
              className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
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
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Firmness</div>
          <select
            value={state.firmness}
            onChange={(e) => update({ firmness: e.target.value })}
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
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
            placeholder="e.g. CozyFoam"
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Rating</div>
          <select
            value={String(state.minRating ?? 0)}
            onChange={(e) => update({ minRating: Number(e.target.value) })}
            className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
          >
            <option value="0">Any</option>
            <option value="3">3★ & up</option>
            <option value="4">4★ & up</option>
            <option value="4.5">4.5★ & up</option>
          </select>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm font-semibold hover:border-[rgb(var(--brand))]"
        >
          Clear all
        </button>
      </div>
    </aside>
  )
}

