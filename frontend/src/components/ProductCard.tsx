import { Link } from 'react-router-dom'
import type { Product } from '../types/catalog'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { wishlistActions } from '../store/slices/wishlistSlice'
import { productMinVariant, productPrimaryImage, variantEffectiveFinal } from '../utils/product'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function badgeTheme(type: Product['promoBadgeType'] | undefined) {
  if (type === 'best_seller') return 'bg-orange-500 text-white'
  if (type === 'extra_offer') return 'bg-teal-500 text-white'
  if (type === 'last_chance') return 'bg-red-500 text-white'
  if (type === 'trial_100_nights') return 'bg-teal-600 text-white'
  return 'bg-orange-500 text-white'
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
    <div className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
      <Link to={`/products/${product._id}`} className="block flex-1">
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white px-3 py-2">
          <div className="min-w-0">
            <div
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeTheme(product.promoBadgeType)}`}
            >
              {product.promoBadgeText ?? 'Special'}
            </div>
            <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-600">
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
              wished ? 'text-red-500' : 'text-slate-400 hover:text-red-500',
            ].join(' ')}
            aria-label="Wishlist"
          >
            {wished ? '♥' : '♡'}
          </button>
        </div>

        <div className="mt-3 aspect-[4/3] rounded-xl border border-slate-100 bg-white p-3">
          <div className="grid h-full w-full place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-slate-100">
            {image ? (
              <img
                src={image}
                alt={product.productName}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-slate-500">No image</div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-2xl font-bold tracking-tight text-slate-900">{product.productName}</div>
              <div className="mt-1 text-xs text-slate-500">By {product.brand}</div>
            </div>
            {discountPct > 0 ? (
              <div className="shrink-0 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                {discountPct}% off
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
            <span className="text-yellow-500">★</span>
            <span>{product.warrantyPeriod}</span>
          </div>

          <div className="mt-1 text-sm font-semibold text-blue-600">
            EMI from {formatMoney(Math.max(1, Math.round(finalPrice / 21)))}/mo
          </div>
          <div className="mt-1 text-xs text-slate-500">{product.deliveryTimeline}</div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Starting from</div>
          <div className="mt-1 flex items-end gap-2">
            <div className="text-3xl font-bold leading-none tracking-tight text-slate-900">{formatMoney(finalPrice)}</div>
            {basePrice > finalPrice ? (
              <div className="pb-0.5 text-sm text-slate-400 line-through">{formatMoney(basePrice)}</div>
            ) : null}
          </div>
          {variants.length > 1 ? (
            <div className="mt-1 text-xs text-slate-500">Price varies by size & thickness</div>
          ) : (
            <div className="mt-1 text-xs text-slate-500">Final price may vary by offer availability</div>
          )}
          {variants.length === 1 ? (
            <div className="mt-1 text-[11px] text-slate-500">
              Inclusive of taxes. Shipping timeline shown at checkout.
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
