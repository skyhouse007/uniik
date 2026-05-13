import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { cartActions } from '../store/slices/cartSlice'
import { loadRazorpaySdk } from '../utils/razorpay'
import { createPaymentOrder, recordPaymentFailure, verifyPayment } from '../api/payments'
import { PaymentTrustSection } from '../components/payment/PaymentTrustSection'
import { checkProductDelivery } from '../api/catalog'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function computeCouponDiscount(subtotal: number, code?: string) {
  if (!code) return 0
  if (code === 'SLEEP10') return Math.round(subtotal * 0.1)
  if (code === 'COZY15') return Math.round(subtotal * 0.15)
  return 0
}

const inputClass =
  'rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45'

export function CheckoutPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { getToken } = useAuth()
  const { user } = useUser()
  const cart = useAppSelector((s) => s.cart)

  const subtotal = useMemo(() => cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [cart.items])
  const couponDiscount = useMemo(() => computeCouponDiscount(subtotal, cart.couponCode), [cart.couponCode, subtotal])
  const shipping = 0
  const total = Math.max(0, subtotal - couponDiscount + shipping)

  const [address, setAddress] = useState({
    fullName: user?.fullName ?? '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)

  async function assertDeliverableOrThrow(pincodeRaw: string) {
    const pin = pincodeRaw.replace(/\D/g, '')
    if (pin.length !== 6) throw new Error('Please enter a valid 6-digit pincode for delivery.')
    const items = cart.items
    if (!items.length) throw new Error('Your cart is empty.')

    const results = await Promise.allSettled(items.map((i) => checkProductDelivery(i.productId, pin)))
    for (let idx = 0; idx < results.length; idx++) {
      const r = results[idx]
      if (r.status === 'rejected') {
        throw new Error('Could not verify delivery for this pincode right now. Please try again.')
      }
      if (!r.value?.ok) {
        const msg = r.value?.message ?? r.value?.error ?? 'Sorry, delivery is not available in your area.'
        throw new Error(msg)
      }
    }
  }

  async function payNow() {
    setError(null)
    setCanRetry(false)
    if (!cart.items.length) {
      setError('Your cart is empty.')
      return
    }
    if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
      setError('Please fill all required address fields.')
      return
    }
    const pinDigits = address.pincode.replace(/\D/g, '')
    if (pinDigits.length !== 6) {
      setError('Please enter a valid 6-digit pincode for delivery.')
      return
    }

    setBusy(true)
    try {
      await assertDeliverableOrThrow(address.pincode)

      const ok = await loadRazorpaySdk()
      if (!ok) throw new Error('Failed to load Razorpay. Please check your connection.')

      const token = await getToken()
      if (!token) throw new Error('Not authenticated.')

      const order = await createPaymentOrder(token, {
        amountInPaise: Math.round(total * 100),
      })

      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Uniik',
        description: 'Order payment',
        order_id: order.razorpayOrderId,
        prefill: { name: address.fullName, contact: address.phone },
        theme: { color: '#fafafa' },
        handler: async (response: any) => {
          try {
            const token2 = await getToken()
            if (!token2) throw new Error('Not authenticated.')
            const verified = await verifyPayment(token2, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              address,
              lineItems: cart.items.map((i) => ({
                productId: i.productId,
                name: i.name,
                image: i.image,
                quantity: i.quantity,
                selectedVariantCategory: i.selectedVariantCategory,
                selectedSize: i.selectedSize,
                selectedThickness: i.selectedThickness,
                unitPrice: i.unitPrice,
              })),
              couponDiscount,
              shipping,
            })
            dispatch(cartActions.clearCart())
            navigate(`/orders?new=${encodeURIComponent(verified.orderId)}`)
          } catch (e: any) {
            setError(e?.response?.data?.error ?? e?.message ?? 'Payment verification failed.')
            setCanRetry(true)
          } finally {
            setBusy(false)
          }
        },
        modal: {
          ondismiss: async () => {
            setBusy(false)
            setError('Payment was cancelled. You can retry.')
            setCanRetry(true)
            try {
              const token3 = await getToken()
              if (token3 && order.razorpayOrderId) {
                await recordPaymentFailure(token3, { razorpay_order_id: order.razorpayOrderId })
              }
            } catch {
              // ignore
            }
          },
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(rzp as any).on?.('payment.failed', async (resp: any) => {
        setBusy(false)
        setError(resp?.error?.description ?? 'Payment failed. Please try again.')
        setCanRetry(true)
        try {
          const token4 = await getToken()
          if (token4 && order.razorpayOrderId) {
            await recordPaymentFailure(token4, {
              razorpay_order_id: order.razorpayOrderId,
              error: { code: resp?.error?.code, description: resp?.error?.description },
            })
          }
        } catch {
          // ignore
        }
      })

      rzp.open()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Checkout failed.')
      setBusy(false)
      setCanRetry(true)
    }
  }

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Checkout — Uniik</title>
        <meta name="description" content="Secure checkout with Razorpay and address management." />
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-header text-xl font-extrabold tracking-tight text-[rgb(var(--fg))]">Checkout</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">Address • Order summary • Razorpay payment</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-3xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Delivery address</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))]">
              Full name *
              <input
                value={address.fullName}
                onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))]">
              Phone *
              <input
                value={address.phone}
                onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                className={inputClass}
                inputMode="tel"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))] sm:col-span-2">
              Address line 1 *
              <input
                value={address.line1}
                onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))] sm:col-span-2">
              Address line 2
              <input
                value={address.line2}
                onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))]">
              City *
              <input
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))]">
              State *
              <input
                value={address.state}
                onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))]">
              Pincode *
              <input
                value={address.pincode}
                onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
                className={inputClass}
                inputMode="numeric"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--muted))]">
              Landmark
              <input
                value={address.landmark}
                onChange={(e) => setAddress((a) => ({ ...a, landmark: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </section>

        <aside className="h-fit rounded-3xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Order summary</div>
          <div className="mt-4 space-y-3">
            {cart.items.map((i) => (
              <div
                key={`${i.productId}|${i.selectedVariantCategory}|${i.selectedSize}|${i.selectedThickness}`}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[rgb(var(--fg))]">{i.name}</div>
                  <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                    Qty {i.quantity}
                    {i.selectedVariantCategory ? ` • ${i.selectedVariantCategory}` : ''}
                    {i.selectedSize ? ` • ${i.selectedSize}` : ''}
                    {i.selectedThickness ? ` · ${i.selectedThickness}` : ''}
                  </div>
                </div>
                <div className="font-semibold text-[rgb(var(--fg))]">{formatMoney(i.unitPrice * i.quantity)}</div>
              </div>
            ))}
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between text-sm">
              <div className="text-[rgb(var(--muted))]">Subtotal</div>
              <div className="font-semibold text-[rgb(var(--fg))]">{formatMoney(subtotal)}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-[rgb(var(--muted))]">Shipping</div>
              <div className="font-semibold text-[rgb(var(--fg))]">{shipping ? formatMoney(shipping) : 'Free'}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-[rgb(var(--muted))]">Coupon</div>
              <div className="font-semibold text-[rgb(var(--fg))]">
                {couponDiscount ? `- ${formatMoney(couponDiscount)}` : formatMoney(0)}
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[rgb(var(--fg))]">Total</div>
              <div className="text-lg font-extrabold text-[rgb(var(--fg))]">{formatMoney(total)}</div>
            </div>
          </div>

          <div className="mt-5">
            <PaymentTrustSection price={total} variant="summary" />
          </div>

          <button
            disabled={busy || !cart.items.length}
            onClick={payNow}
            className="mt-5 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {busy ? 'Opening Razorpay…' : 'Pay with Razorpay'}
          </button>
          {canRetry && !busy && cart.items.length ? (
            <button
              type="button"
              onClick={payNow}
              className="mt-2 w-full rounded-2xl border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/10"
            >
              Retry payment
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
