import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { trackOrder, type TrackOrderResult } from '../api/site'
import { useAuth } from '@clerk/clerk-react'
import { fetchMyOrders, type Order } from '../api/orders'
import { Skeleton } from '../components/Skeleton'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string | undefined) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

const activeSteps = [
  { id: 'created', label: 'Order Created' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
] as const

const cancelledSteps = [
  { id: 'created', label: 'Order Created' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
] as const

function statusIndex(status: Order['orderStatus']): number {
  if (status === 'cancelled') return 4
  if (status === 'delivered') return 3
  if (status === 'shipped') return 2
  if (status === 'processing') return 1
  return 0
}

function OrderStepper({ status }: { status: Order['orderStatus'] }) {
  const idx = statusIndex(status)
  const isCancelled = status === 'cancelled'
  const isDelivered = status === 'delivered'
  const steps = isCancelled ? cancelledSteps : activeSteps
  const lastIdx = steps.length - 1

  const progressColor = isCancelled ? 'bg-red-300' : isDelivered ? 'bg-emerald-500' : 'bg-[rgb(var(--brand))]'

  return (
    <div className="mt-6">
      <div className="relative mx-auto max-w-3xl">
        <div className="absolute left-4 right-4 top-4 h-[2px] bg-white/15" />
        <div
          className={['absolute left-4 top-4 h-[2px]', progressColor].join(' ')}
          style={{
            width: `${Math.max(0, Math.min(100, (idx / Math.max(1, lastIdx)) * 100))}%`,
          }}
        />

        <div className={`grid gap-2 ${steps.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {steps.map((s, i) => {
            const isActive = i === idx
            const isDone = !isCancelled ? i < idx : i === idx
            const isMuted = isCancelled ? i !== idx : i > idx

            const doneColor = isDelivered ? 'bg-emerald-500 ring-emerald-500' : 'bg-[rgb(var(--brand))] ring-[rgb(var(--brand))]'
            const activeColor = isCancelled
              ? 'bg-red-600 ring-red-600'
              : isDelivered && i === idx
                ? 'bg-emerald-600 ring-emerald-600'
                : 'bg-[rgb(var(--brand))] ring-[rgb(var(--brand))]'

            const inactiveDot = 'bg-neutral-800 ring-white/20'

            const dotClass = isCancelled
              ? isActive
                ? activeColor
                : inactiveDot
              : isActive
                ? activeColor
                : isDone
                  ? doneColor
                  : inactiveDot

            return (
              <div key={s.id} className="flex flex-col items-center text-center">
                <div className={['relative z-10 h-8 w-8 rounded-full ring-2', dotClass].join(' ')} />
                <div
                  className={[
                    'mt-3 text-xs font-semibold',
                    isMuted ? 'text-[rgb(var(--muted))]' : isDelivered && (i <= idx) ? 'text-emerald-700' : 'text-[rgb(var(--fg))]',
                  ].join(' ')}
                >
                  {s.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function TrackOrderPage() {
  const { getToken } = useAuth()
  const [items, setItems] = useState<Order[] | null>(null)
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<TrackOrderResult | null>(null)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const token = await getToken()
        if (!token) {
          if (alive) setItems([])
          return
        }
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

  const activeOrder = useMemo(() => {
    const list = items ?? []
    if (!list.length) return null
    if (activeId) return list.find((x) => x._id === activeId) ?? list[0] ?? null
    return list[0] ?? null
  }, [activeId, items])

  async function submit() {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const data = await trackOrder({ orderId: orderId.trim(), phone: phone.trim() })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Unable to track this order')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Track Your Order — Uniik</title>
      </Helmet>
      <div className="font-header text-xl font-extrabold tracking-tight text-[rgb(var(--fg))]">Track My Order</div>
      <div className="mt-1 text-sm text-[rgb(var(--muted))]">Latest status updates from Uniik.</div>

      {items === null ? (
        <div className="mt-6 grid max-w-3xl gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : items.length ? (
        <div className="mt-6 max-w-4xl">
          <div className="rounded-3xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-extrabold tracking-tight text-[rgb(var(--fg))]">Track My Order</div>
                {activeOrder ? (
                  <div className="mt-2 text-sm text-[rgb(var(--muted))]">
                    Order ID: <span className="font-semibold text-[rgb(var(--fg))]">#{activeOrder._id.slice(-8)}</span>
                  </div>
                ) : null}
              </div>
              {items.length > 1 ? (
                <select
                  value={activeOrder?._id ?? ''}
                  onChange={(e) => setActiveId(e.target.value)}
                  className="rounded-xl border border-white/20 bg-black px-3 py-2 text-sm font-semibold text-white outline-none focus:border-white/45"
                >
                  {items.map((o) => (
                    <option key={o._id} value={o._id}>
                      Order #{o._id.slice(-8)} • {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {activeOrder ? (
              <>
                <div className="mt-4 rounded-2xl border border-white/12 bg-black/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[rgb(var(--fg))]">Order ID: #{activeOrder._id.slice(-8)}</div>
                    <div className="text-xs font-semibold text-[rgb(var(--muted))]">
                      Placed: {new Date(activeOrder.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-[rgb(var(--muted))]">
                    Expected Delivery:{' '}
                    <span className="font-semibold text-[rgb(var(--fg))]">
                      {formatDate(activeOrder.updatedAt ?? activeOrder.createdAt) || '—'}
                    </span>
                  </div>
                </div>

                <OrderStepper status={activeOrder.orderStatus} />

                <div className="mt-6 grid gap-2">
                  {activeOrder.products.slice(0, 4).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 truncate text-[rgb(var(--muted))]">
                        {p.name} × {p.quantity}
                        {p.selectedSize || p.size || p.selectedVariantCategory
                          ? ` (${[p.selectedVariantCategory, p.selectedSize || p.size, p.selectedThickness]
                              .filter(Boolean)
                              .join(' · ')})`
                          : ''}
                      </div>
                      <div className="font-semibold">{formatMoney(p.unitPrice * p.quantity)}</div>
                    </div>
                  ))}
                  {activeOrder.products.length > 4 ? (
                    <div className="text-xs text-[rgb(var(--muted))]">+ {activeOrder.products.length - 4} more items</div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-6 max-w-2xl rounded-3xl border border-white/12 bg-black/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="grid gap-3">
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID"
              className="rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45"
            />
            <button
              onClick={submit}
              disabled={busy || orderId.trim().length < 4 || phone.trim().length < 3}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {busy ? 'Tracking...' : 'Track order'}
            </button>
          </div>
        </div>
      )}

      {error ? <div className="mt-4 text-sm text-red-400">{error}</div> : null}

      {result ? (
        <div className="mt-6 max-w-2xl rounded-3xl border border-white/12 bg-black/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Order #{result._id.slice(-8)}</div>
          <div className="mt-1 text-xs text-[rgb(var(--muted))]">{new Date(result.createdAt).toLocaleString()}</div>
          <div className="mt-3 text-sm text-[rgb(var(--fg))]">
            <span className="font-semibold">Status:</span> {String(result.orderStatus).toUpperCase()}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--fg))]">
            <span className="font-semibold">Payment:</span> {String(result.paymentStatus).toUpperCase()}
          </div>
          <div className="mt-1 text-sm text-[rgb(var(--fg))]">
            <span className="font-semibold">Total:</span> {formatMoney(result.totalAmount)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
