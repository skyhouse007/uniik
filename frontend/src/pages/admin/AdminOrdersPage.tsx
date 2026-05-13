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

const selectFilter =
  'rounded-xl border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/45'

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
        <title>Admin Orders — Uniik</title>
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">Orders</div>
          <div className="mt-1 text-sm text-white/60">Track payments and fulfillment</div>
        </div>
        <div className="text-xs text-white/55">
          {summary.total} total • {summary.paid} paid • {summary.pending} pending
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectFilter}>
          <option value="">All statuses</option>
          <option value="created">Created</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={payment} onChange={(e) => setPayment(e.target.value)} className={selectFilter}>
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error ? <div className="mt-4 admin-alert-error">{error}</div> : null}

      <div className="mt-5 grid gap-2">
        {items === null ? (
          <div className="text-sm text-white/55">Loading…</div>
        ) : items.length ? (
          items.map((o: any) => (
            <button
              key={o._id}
              onClick={() => setSelectedId(o._id)}
              className="rounded-2xl border border-white/12 bg-neutral-950 p-4 text-left text-white transition hover:border-white/20 hover:bg-neutral-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Order #{o._id.slice(-8)}</div>
                  <div className="mt-1 text-xs text-white/55">
                    {new Date(o.createdAt).toLocaleString()} • User: {o.userId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{formatMoney(o.totalAmount)}</div>
                  <div className="mt-1 text-xs text-white/55">
                    {String(o.paymentStatus).toUpperCase()} • {String(o.orderStatus).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm">
                {(o.products ?? []).slice(0, 3).map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-white/55">
                      {p.name} × {p.quantity} {p.size ? `(${p.size})` : ''}
                    </div>
                    <div className="font-semibold text-white">{formatMoney(p.unitPrice * p.quantity)}</div>
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
                  className={selectFilter}
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
                  className={selectFilter}
                >
                  <option value="paid">paid</option>
                  <option value="pending">pending</option>
                  <option value="failed">failed</option>
                </select>
              </div>
            </button>
          ))
        ) : (
          <div className="text-sm text-white/55">No orders yet.</div>
        )}
      </div>

      {selectedId ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" onClick={() => setSelectedId(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-auto border-l border-white/10 bg-neutral-950 text-white shadow-2xl">
            <div className="sticky top-0 border-b border-white/10 bg-black/80 px-5 py-4 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Order details</div>
                  <div className="mt-1 text-xs text-white/55">{selectedId}</div>
                </div>
                <button type="button" className="admin-btn-outline px-3 py-2 text-xs" onClick={() => setSelectedId(null)}>
                  Close
                </button>
              </div>
            </div>

            <div className="p-5">
              {drawerBusy ? (
                <div className="text-sm text-white/55">Loading…</div>
              ) : selected ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/12 bg-black/50 p-4">
                    <div className="text-xs font-semibold text-white/55">Razorpay</div>
                    <div className="mt-2 grid gap-1 text-sm">
                      <div>
                        <span className="text-white/55">orderId:</span>{' '}
                        <span className="font-mono text-xs text-white">{selected.razorpay?.orderId ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-white/55">paymentId:</span>{' '}
                        <span className="font-mono text-xs text-white">{selected.razorpay?.paymentId ?? '-'}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="admin-btn-outline text-xs"
                        onClick={() => copy(selected.razorpay?.orderId ?? '')}
                        disabled={!selected.razorpay?.orderId}
                      >
                        Copy orderId
                      </button>
                      <button
                        type="button"
                        className="admin-btn-outline text-xs"
                        onClick={() => copy(selected.razorpay?.paymentId ?? '')}
                        disabled={!selected.razorpay?.paymentId}
                      >
                        Copy paymentId
                      </button>
                      <button
                        type="button"
                        className="admin-btn-outline text-xs"
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

                  <div className="rounded-2xl border border-white/12 bg-black/35 p-4">
                    <div className="text-sm font-semibold text-white">Address</div>
                    <div className="mt-2 text-sm text-white/65">
                      {selected.address?.fullName ?? ''} • {selected.address?.phone ?? ''}
                      <div className="mt-1">
                        {selected.address?.line1 ?? ''} {selected.address?.line2 ?? ''}
                      </div>
                      <div className="mt-1">
                        {selected.address?.city ?? ''}, {selected.address?.state ?? ''} {selected.address?.pincode ?? ''}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/12 bg-black/35 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-white">Items</div>
                      <div className="text-sm font-semibold text-white">{formatMoney(selected.totalAmount)}</div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm">
                      {(selected.products ?? []).map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <div className="min-w-0 truncate text-white/55">
                            {p.name} × {p.quantity} {p.size ? `(${p.size})` : ''}
                          </div>
                          <div className="font-semibold text-white">{formatMoney(p.unitPrice * p.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/12 bg-black/35 p-4">
                    <div className="text-sm font-semibold text-white">Status</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        value={selected.orderStatus}
                        onChange={async (e) => {
                          await adminPut(`/admin/orders/${selected._id}`, { orderStatus: e.target.value })
                          await load()
                          setSelectedId(selected._id)
                        }}
                        className={selectFilter}
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
                        className={selectFilter}
                      >
                        <option value="paid">paid</option>
                        <option value="pending">pending</option>
                        <option value="failed">failed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/55">Failed to load order.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
