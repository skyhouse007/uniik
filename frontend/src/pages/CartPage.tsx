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
        <title>Cart — CozyFoam</title>
        <meta name="description" content="Review your cart and proceed to secure checkout." />
      </Helmet>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-extrabold tracking-tight">Cart</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">
            {cart.items.length} items
          </div>
        </div>
        {cart.items.length ? (
          <button
            onClick={() => dispatch(cartActions.clearCart())}
            className="text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--brand))]"
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
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 text-sm text-[rgb(var(--muted))]">
              Your cart is empty. <Link className="font-semibold text-[rgb(var(--brand))]" to="/products">Shop mattresses</Link>.
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold">Price summary</div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Subtotal</div>
              <div className="font-semibold">{formatMoney(subtotal)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Shipping</div>
              <div className="font-semibold">{shipping ? formatMoney(shipping) : 'Free'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Coupon</div>
              <div className="font-semibold">{couponDiscount ? `- ${formatMoney(couponDiscount)}` : formatMoney(0)}</div>
            </div>
            <div className="h-px bg-[rgb(var(--border))]" />
            <div className="flex items-center justify-between">
              <div className="text-[rgb(var(--muted))]">Total</div>
              <div className="text-lg font-extrabold">{formatMoney(total)}</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[rgb(var(--surface))] p-4">
            <div className="text-xs font-semibold text-[rgb(var(--muted))]">Coupon code</div>
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SLEEP10"
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
              />
              <button
                onClick={() => dispatch(cartActions.applyCoupon(code))}
                className="rounded-xl bg-[rgb(var(--brand))] px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>
            {cart.couponCode ? (
              <button
                onClick={() => dispatch(cartActions.removeCoupon())}
                className="mt-2 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--brand))]"
              >
                Remove coupon
              </button>
            ) : null}
          </div>

          <button
            disabled={!cart.items.length}
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full rounded-2xl bg-[rgb(var(--brand))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Proceed to checkout
          </button>

          <button
            disabled={!cart.items.length}
            onClick={() => navigate('/checkout')}
            className="mt-2 w-full rounded-2xl border border-[rgb(var(--border))] bg-white px-5 py-3 text-sm font-semibold text-[rgb(var(--fg))] shadow-sm transition hover:border-[rgb(var(--muted))] hover:shadow disabled:opacity-50"
          >
            Pay with Razorpay
          </button>
        </aside>
      </div>
    </div>
  )
}

