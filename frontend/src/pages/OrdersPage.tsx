import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@clerk/clerk-react'
import { fetchMyOrders, type Order } from '../api/orders'
import { Skeleton } from '../components/Skeleton'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function OrdersPage() {
  const { getToken } = useAuth()
  const [items, setItems] = useState<Order[] | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const token = await getToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fetchMyOrders(token)
        if (!alive) return
        setItems(res.items)
      } catch {
        if (!alive) return
        setItems([])
      }
    })()
    return () => {
      alive = false
    }
  }, [getToken])

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Orders — Uniik</title>
        <meta name="description" content="View your order history and order statuses." />
      </Helmet>
      <div>
        <div className="font-header text-xl font-extrabold tracking-tight text-[rgb(var(--fg))]">Your orders</div>
        <div className="mt-1 text-sm text-[rgb(var(--muted))]">Order history & status</div>
      </div>

      <div className="mt-6 grid gap-4">
        {items === null ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : items.length ? (
          items.map((o) => (
            <div
              key={o._id}
              className="rounded-2xl border border-white/12 bg-black/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--fg))]">Order #{o._id.slice(-8)}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[rgb(var(--fg))]">{formatMoney(o.totalAmount)}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {o.paymentStatus.toUpperCase()} • {o.orderStatus.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
                {o.products.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 truncate text-[rgb(var(--muted))]">
                      {p.name} × {p.quantity}
                      {p.selectedSize || p.size || p.selectedVariantCategory
                        ? ` (${[p.selectedVariantCategory, p.selectedSize || p.size, p.selectedThickness].filter(Boolean).join(' · ')})`
                        : ''}
                    </div>
                    <div className="font-semibold text-[rgb(var(--fg))]">{formatMoney(p.unitPrice * p.quantity)}</div>
                  </div>
                ))}
                {o.products.length > 3 ? (
                  <div className="text-xs text-[rgb(var(--muted))]">+ {o.products.length - 3} more items</div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/12 bg-black/45 p-6 text-sm text-[rgb(var(--muted))] backdrop-blur-sm">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  )
}
