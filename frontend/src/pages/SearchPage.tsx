import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import { searchProducts } from '../api/catalog'
import type { Product } from '../types/catalog'
import { ProductCard } from '../components/ProductCard'
import { Skeleton } from '../components/Skeleton'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q0 = params.get('q') ?? ''
  const [q, setQ] = useState(q0)
  const [items, setItems] = useState<Product[] | null>(null)

  useEffect(() => {
    setQ(q0)
  }, [q0])

  const query = useMemo(() => q.trim(), [q])

  useEffect(() => {
    if (!query) {
      setItems([])
      return
    }
    let alive = true
    setItems(null)
    const t = setTimeout(() => {
      searchProducts(query)
        .then((res) => alive && setItems(res))
        .catch(() => alive && setItems([]))
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [query])

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Search — Uniik</title>
        <meta name="description" content="Real-time search for products, sizes, and brands." />
      </Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-header text-xl font-extrabold tracking-tight text-[rgb(var(--fg))]">Search</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">Real-time product search</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/12 bg-black/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
        <input
          value={q}
          onChange={(e) => {
            const next = e.target.value
            setQ(next)
            setParams((prev) => {
              const p = new URLSearchParams(prev)
              if (!next.trim()) p.delete('q')
              else p.set('q', next)
              return p
            })
          }}
          placeholder="Search products, brands, sizes…"
          className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items === null ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
        ) : items.length ? (
          items.map((p) => <ProductCard key={p._id} product={p} />)
        ) : (
          <div className="rounded-2xl border border-white/12 bg-black/45 p-6 text-sm text-[rgb(var(--muted))] backdrop-blur-sm">
            {query ? 'No results found.' : 'Type to search.'}
          </div>
        )}
      </div>
    </div>
  )
}

