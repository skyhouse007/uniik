import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { adminGet, adminPut } from '../../api/adminClient'

type Order = any

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function AdminOrdersPage() {
  const [items, setItems] = useState<Order[] | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [payment, setPayment] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Order | null>(null)
  const [drawerBusy, setDrawerBusy] = useState(false)

  async function load() {
    setError('')
    const res = await adminGet<{ items: Order[]; total: number }>('/admin/orders', {
      page: 1,
      limit: 50,
      status: status || undefined,
      payment: payment || undefined,
    })
    setItems(res.items)
  }

  useEffect(() => {
    load().catch((e: any) => setError(e?.response?.data?.error ?? 'Failed to load orders'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, payment])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }
    let alive = true
    setDrawerBusy(true)
    adminGet<Order>(`/admin/orders/${selectedId}`)
      .then((o) => alive && setSelected(o))
      .catch(() => alive && setSelected(null))
      .finally(() => alive && setDrawerBusy(false))
    return () => {
      alive = false
    }
  }, [selectedId])

  const summary = useMemo(() => {
    const list = items ?? []
    const total = list.length
    const paid = list.filter((o) => o.paymentStatus === 'paid').length
    const pending = list.filter((o) => o.paymentStatus === 'pending').length
    return { total, paid, pending }
  }, [items])

  return (
    <div>
      <Helmet>
        <title>Admin Orders — CozyFoam</title>
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold">Orders</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">Track payments and fulfillment</div>
        </div>
        <div className="text-xs text-[rgb(var(--muted))]">
          {summary.total} total • {summary.paid} paid • {summary.pending} pending
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="created">Created</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
        >
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

      <div className="mt-5 grid gap-2">
        {items === null ? (
          <div className="text-sm text-[rgb(var(--muted))]">Loading…</div>
        ) : items.length ? (
          items.map((o: any) => (
            <button
              key={o._id}
              onClick={() => setSelectedId(o._id)}
              className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Order #{o._id.slice(-8)}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {new Date(o.createdAt).toLocaleString()} • User: {o.userId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatMoney(o.totalAmount)}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {String(o.paymentStatus).toUpperCase()} • {String(o.orderStatus).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                {(o.products ?? []).slice(0, 3).map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-[rgb(var(--muted))]">
                      {p.name} × {p.quantity} {p.size ? `(${p.size})` : ''}
                    </div>
                    <div className="font-semibold">{formatMoney(p.unitPrice * p.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <select
                  defaultValue={o.orderStatus}
                  onChange={async (e) => {
                    await adminPut(`/admin/orders/${o._id}`, { orderStatus: e.target.value })
                    await load()
                  }}
                  className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
                >
                  <option value="created">created</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <select
                  defaultValue={o.paymentStatus}
                  onChange={async (e) => {
                    await adminPut(`/admin/orders/${o._id}`, { paymentStatus: e.target.value })
                    await load()
                  }}
                  className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
                >
                  <option value="paid">paid</option>
                  <option value="pending">pending</option>
                  <option value="failed">failed</option>
                </select>
              </div>
            </button>
          ))
        ) : (
          <div className="text-sm text-[rgb(var(--muted))]">No orders yet.</div>
        )}
      </div>

      {selectedId ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedId(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-auto bg-white shadow-2xl">
            <div className="sticky top-0 border-b border-[rgb(var(--border))] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Order details</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">{selectedId}</div>
                </div>
                <button
                  className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-xs font-semibold"
                  onClick={() => setSelectedId(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-5">
              {drawerBusy ? (
                <div className="text-sm text-[rgb(var(--muted))]">Loading…</div>
              ) : selected ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                    <div className="text-xs font-semibold text-[rgb(var(--muted))]">Razorpay</div>
                    <div className="mt-2 grid gap-1 text-sm">
                      <div>
                        <span className="text-[rgb(var(--muted))]">orderId:</span>{' '}
                        <span className="font-mono text-xs">{selected.razorpay?.orderId ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-[rgb(var(--muted))]">paymentId:</span>{' '}
                        <span className="font-mono text-xs">{selected.razorpay?.paymentId ?? '-'}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-semibold"
                        onClick={() => copy(selected.razorpay?.orderId ?? '')}
                        disabled={!selected.razorpay?.orderId}
                      >
                        Copy orderId
                      </button>
                      <button
                        className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-semibold"
                        onClick={() => copy(selected.razorpay?.paymentId ?? '')}
                        disabled={!selected.razorpay?.paymentId}
                      >
                        Copy paymentId
                      </button>
                      <button
                        className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-semibold"
                        onClick={() =>
                          copy(
                            `orderId=${selected.razorpay?.orderId ?? ''}\npaymentId=${selected.razorpay?.paymentId ?? ''}`,
                          )
                        }
                      >
                        Copy both
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                    <div className="text-sm font-semibold">Address</div>
                    <div className="mt-2 text-sm text-[rgb(var(--muted))]">
                      {selected.address?.fullName ?? ''} • {selected.address?.phone ?? ''}
                      <div className="mt-1">
                        {selected.address?.line1 ?? ''} {selected.address?.line2 ?? ''}
                      </div>
                      <div className="mt-1">
                        {selected.address?.city ?? ''}, {selected.address?.state ?? ''} {selected.address?.pincode ?? ''}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Items</div>
                      <div className="text-sm font-semibold">{formatMoney(selected.totalAmount)}</div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm">
                      {(selected.products ?? []).map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <div className="min-w-0 truncate text-[rgb(var(--muted))]">
                            {p.name} × {p.quantity} {p.size ? `(${p.size})` : ''}
                          </div>
                          <div className="font-semibold">{formatMoney(p.unitPrice * p.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
                    <div className="text-sm font-semibold">Status</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        value={selected.orderStatus}
                        onChange={async (e) => {
                          await adminPut(`/admin/orders/${selected._id}`, { orderStatus: e.target.value })
                          await load()
                          setSelectedId(selected._id)
                        }}
                        className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
                      >
                        <option value="created">created</option>
                        <option value="processing">processing</option>
                        <option value="shipped">shipped</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <select
                        value={selected.paymentStatus}
                        onChange={async (e) => {
                          await adminPut(`/admin/orders/${selected._id}`, { paymentStatus: e.target.value })
                          await load()
                          setSelectedId(selected._id)
                        }}
                        className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
                      >
                        <option value="paid">paid</option>
                        <option value="pending">pending</option>
                        <option value="failed">failed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[rgb(var(--muted))]">Failed to load order.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

