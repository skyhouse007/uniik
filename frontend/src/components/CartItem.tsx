import { cartActions } from '../store/slices/cartSlice'
import type { CartItem as CartItemType } from '../store/slices/cartSlice'
import { useAppDispatch } from '../store/hooks'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function lineRef(item: CartItemType) {
  return {
    productId: item.productId,
    selectedVariantCategory: item.selectedVariantCategory,
    selectedSize: item.selectedSize,
    selectedThickness: item.selectedThickness,
  }
}

export function CartItem({ item }: { item: CartItemType }) {
  const dispatch = useAppDispatch()
  const ref = lineRef(item)
  return (
    <div className="flex gap-4 rounded-2xl border border-white/12 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
      <div className="h-20 w-24 overflow-hidden rounded-xl border border-white/10 bg-black/60">
        {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--fg))]">{item.name}</div>
            <div className="mt-1 text-xs text-[rgb(var(--muted))]">
              {item.selectedVariantCategory ? `${item.selectedVariantCategory} · ` : null}
              {item.selectedSize ? `Size: ${item.selectedSize}` : null}
              {item.selectedSize && item.selectedThickness ? ' · ' : null}
              {item.selectedThickness ? `Thickness: ${item.selectedThickness}` : null}
            </div>
          </div>
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">{formatMoney(item.unitPrice * item.quantity)}</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-xl border border-white/20">
            <button
              type="button"
              className="px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() =>
                dispatch(cartActions.setQuantity({ ...ref, quantity: item.quantity - 1 }))
              }
              aria-label="Decrease quantity"
            >
              -
            </button>
            <div className="border-x border-white/20 px-3 py-2 text-sm text-[rgb(var(--fg))]">{item.quantity}</div>
            <button
              type="button"
              className="px-3 py-2 text-sm text-white transition hover:bg-white/10"
              onClick={() =>
                dispatch(cartActions.setQuantity({ ...ref, quantity: item.quantity + 1 }))
              }
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/90 transition hover:border-white/40 hover:bg-white/10"
            onClick={() => dispatch(cartActions.removeFromCart(ref))}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
