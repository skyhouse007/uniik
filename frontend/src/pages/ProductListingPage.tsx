import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../api/catalog'
import type { Product } from '../types/catalog'
import { FilterSidebar } from '../components/FilterSidebar'
import { ProductCard } from '../components/ProductCard'
import { Skeleton } from '../components/Skeleton'

function toNum(s: string | null, fallback: number) {
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function ProductListingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [data, setData] = useState<{
    items: Product[]
    page: number
    limit: number
    total: number
  } | null>(null)

  const query = useMemo(() => {
    const page = toNum(params.get('page'), 1)
    const limit = toNum(params.get('limit'), 12)
    const sort = params.get('sort') ?? 'popularity'
    const category = params.get('category') ?? undefined
    const brand = params.get('brand') ?? undefined
    const size = params.get('size') ?? undefined
    const firmness = params.get('firmness') ?? undefined
    const minPrice = params.get('minPrice') ? Number(params.get('minPrice')) : undefined
    const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined
    const minRating = params.get('minRating') ? Number(params.get('minRating')) : undefined
    return { page, limit, sort, category, brand, size, firmness, minPrice, maxPrice, minRating }
  }, [params])

  useEffect(() => {
    let alive = true
    setData(null)
    fetchProducts(query)
      .then((res) => alive && setData(res))
      .catch(() => alive && setData({ items: [], page: query.page ?? 1, limit: query.limit ?? 12, total: 0 }))
    return () => {
      alive = false
    }
  }, [query])

  function setParam(k: string, v: string) {
    const p = new URLSearchParams(params)
    if (!v) p.delete(k)
    else p.set(k, v)
    p.set('page', '1')
    navigate({ pathname: '/products', search: p.toString() })
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container-page py-8">
        <Helmet>
          <title>Mattresses — CozyFoam</title>
          <meta name="description" content="Browse mattresses with filters, sorting, and premium brand highlights." />
        </Helmet>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold tracking-tight">Mattresses</div>
            <div className="mt-1 text-sm text-[rgb(var(--muted))]">Filters • Sorting • Pagination</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-[rgb(var(--muted))]">Sort</div>
            <select
              value={query.sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
            >
              <option value="popularity">Popularity</option>
              <option value="price_asc">Price: low → high</option>
              <option value="price_desc">Price: high → low</option>
              <option value="rating_desc">Rating</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <FilterSidebar />

          <div>
            <div
              className={[
                'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
                data && data.items.length === 1 ? 'place-items-center' : '',
              ].join(' ')}
            >
              {data === null ? (
                Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
              ) : data.items.length ? (
                data.items.map((p) => (
                  <div key={p._id} className={data.items.length === 1 ? 'w-full max-w-md' : 'w-full'}>
                    <ProductCard product={p} />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 text-sm text-[rgb(var(--muted))]">
                  No products found for the selected filters.
                </div>
              )}
            </div>

            {data ? (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[rgb(var(--muted))]">
                  Page {data.page} of {totalPages} • {data.total} items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => setParam('page', String(Math.max(1, data.page - 1)))}
                    className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={data.page >= totalPages}
                    onClick={() => setParam('page', String(Math.min(totalPages, data.page + 1)))}
                    className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

