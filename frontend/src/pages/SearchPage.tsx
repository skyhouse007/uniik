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
        <title>Search — CozyFoam</title>
        <meta name="description" content="Real-time search for mattresses, sizes, and brands." />
      </Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold tracking-tight">Search</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">Real-time product search</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-white p-3 shadow-sm">
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
          placeholder="Search mattresses, brands, sizes…"
          className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[rgb(var(--muted))]"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items === null ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
        ) : items.length ? (
          items.map((p) => <ProductCard key={p._id} product={p} />)
        ) : (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 text-sm text-[rgb(var(--muted))]">
            {query ? 'No results found.' : 'Type to search.'}
          </div>
        )}
      </div>
    </div>
  )
}

