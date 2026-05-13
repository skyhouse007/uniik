import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { CartItem } from '../components/CartItem'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { cartActions } from '../store/slices/cartSlice'
import { useMemo, useState } from 'react'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function computeCouponDiscount(subtotal: number, code?: string) {
  if (!code) return 0
  if (code === 'SLEEP10') return Math.round(subtotal * 0.1)
  if (code === 'COZY15') return Math.round(subtotal * 0.15)
  return 0
}

export function CartPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector((s) => s.cart)
  const [code, setCode] = useState(cart.couponCode ?? '')

  const subtotal = useMemo(() => cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [cart.items])
  const couponDiscount = useMemo(() => computeCouponDiscount(subtotal, cart.couponCode), [cart.couponCode, subtotal])
  const shipping = 0
  const total = Math.max(0, subtotal - couponDiscount + shipping)

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Cart — Uniik</title>
        <meta name="description" content="Review your cart and proceed to secure checkout." />
      </Helmet>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-header text-xl font-extrabold tracking-tight text-[rgb(var(--fg))]">Cart</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">{cart.items.length} items</div>
        </div>
        {cart.items.length ? (
          <button
            onClick={() => dispatch(cartActions.clearCart())}
            className="text-xs font-semibold text-[rgb(var(--muted))] hover:text-white"
          >
            Clear cart
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          {cart.items.length ? (
            cart.items.map((i) => (
              <CartItem
                key={`${i.productId}|${i.selectedVariantCategory}|${i.selectedSize}|${i.selectedThickness}`}
                item={i}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-white/12 bg-black/45 p-6 text-sm text-[rgb(var(--muted))] backdrop-blur-sm">
              Your cart is empty.{' '}
              <Link className="font-semibold text-white underline-offset-4 hover:underline" to="/products">
                Shop products
              </Link>
              .
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Price summary</div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Subtotal</div>
              <div className="font-semibold text-[rgb(var(--fg))]">{formatMoney(subtotal)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Shipping</div>
              <div className="font-semibold text-[rgb(var(--fg))]">{shipping ? formatMoney(shipping) : 'Free'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Coupon</div>
              <div className="font-semibold text-[rgb(var(--fg))]">
                {couponDiscount ? `- ${formatMoney(couponDiscount)}` : formatMoney(0)}
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Total</div>
              <div className="text-lg font-extrabold text-[rgb(var(--fg))]">{formatMoney(total)}</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/55 p-4">
            <div className="text-xs font-semibold text-[rgb(var(--muted))]">Coupon code</div>
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SLEEP10"
                className="w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45"
              />
              <button
                onClick={() => dispatch(cartActions.applyCoupon(code))}
                className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200"
              >
                Apply
              </button>
            </div>
            {cart.couponCode ? (
              <button
                onClick={() => dispatch(cartActions.removeCoupon())}
                className="mt-2 text-xs font-semibold text-[rgb(var(--muted))] hover:text-white"
              >
                Remove coupon
              </button>
            ) : null}
          </div>

          <button
            disabled={!cart.items.length}
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            Proceed to checkout
          </button>

          <button
            disabled={!cart.items.length}
            onClick={() => navigate('/checkout')}
            className="mt-2 w-full rounded-2xl border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/10 disabled:opacity-50"
          >
            Pay with Razorpay
          </button>
        </aside>
      </div>
    </div>
  )
}
