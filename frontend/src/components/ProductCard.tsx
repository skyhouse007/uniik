import { Link } from 'react-router-dom'
import type { Product } from '../types/catalog'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { wishlistActions } from '../store/slices/wishlistSlice'
import { productMinVariant, productPrimaryImage, variantEffectiveFinal } from '../utils/product'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function badgeTheme(type: Product['promoBadgeType'] | undefined) {
  if (type === 'best_seller') return 'bg-orange-500/90 text-white'
  if (type === 'extra_offer') return 'bg-teal-500/90 text-white'
  if (type === 'last_chance') return 'bg-red-500/90 text-white'
  if (type === 'trial_100_nights') return 'bg-teal-600/90 text-white'
  return 'bg-orange-500/90 text-white'
}

export function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch()
  const wished = useAppSelector((s) => s.wishlist.productIds.includes(product._id))
  const variants = product.variants ?? []
  const image = productPrimaryImage(product)
  const minV = productMinVariant({ ...product, variants })
  const finalPrice =
    typeof product.minFinalPrice === 'number' && product.minFinalPrice > 0
      ? product.minFinalPrice
      : minV
        ? variantEffectiveFinal(minV)
        : 0
  const basePrice = minV?.price ?? 0
  const discountPct = minV?.discountPercentage ?? 0

  return (
    <div className="group flex h-full flex-col rounded-3xl border border-white/12 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl">
      <Link to={`/products/${product._id}`} className="block flex-1">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
          <div className="min-w-0">
            <div
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeTheme(product.promoBadgeType)}`}
            >
              {product.promoBadgeText ?? 'Special'}
            </div>
            <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              {product.modelName}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              dispatch(wishlistActions.toggleWishlist(product._id))
            }}
            className={[
              'rounded-full p-1.5 text-lg transition-colors duration-300',
              wished ? 'text-red-400' : 'text-white/40 hover:text-red-400',
            ].join(' ')}
            aria-label="Wishlist"
          >
            {wished ? '♥' : '♡'}
          </button>
        </div>

        <div className="mt-3 aspect-[4/3] rounded-xl border border-white/10 bg-black/50 p-3">
          <div className="grid h-full w-full place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-900 to-black">
            {image ? (
              <img
                src={image}
                alt={product.productName}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-[rgb(var(--muted))]">No image</div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-2xl font-bold tracking-tight text-[rgb(var(--fg))]">{product.productName}</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">By {product.brand}</div>
            </div>
            {discountPct > 0 ? (
              <div className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                {discountPct}% off
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <span className="font-semibold text-white">{product.rating.toFixed(1)}</span>
            <span className="text-yellow-400">★</span>
            <span>{product.warrantyPeriod}</span>
          </div>

          <div className="mt-1 text-sm font-semibold text-white/85">
            EMI from {formatMoney(Math.max(1, Math.round(finalPrice / 21)))}/mo
          </div>
          <div className="mt-1 text-xs text-[rgb(var(--muted))]">{product.deliveryTimeline}</div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Starting from</div>
          <div className="mt-1 flex items-end gap-2">
            <div className="text-3xl font-bold leading-none tracking-tight text-[rgb(var(--fg))]">{formatMoney(finalPrice)}</div>
            {basePrice > finalPrice ? (
              <div className="pb-0.5 text-sm text-white/40 line-through">{formatMoney(basePrice)}</div>
            ) : null}
          </div>
          {variants.length > 1 ? (
            <div className="mt-1 text-xs text-[rgb(var(--muted))]">Price varies by size & thickness</div>
          ) : (
            <div className="mt-1 text-xs text-[rgb(var(--muted))]">Final price may vary by offer availability</div>
          )}
          {variants.length === 1 ? (
            <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">
              Inclusive of taxes. Shipping timeline shown at checkout.
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
