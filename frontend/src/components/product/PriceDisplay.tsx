type Props = {
  /** Selected variant MRP */
  basePrice: number
  /** Selected variant selling price */
  finalPrice: number
  discountPercentage: number
  /** Lowest variant final price (entry price); shown as “Starting from” when `multivariant`. */
  fromFinalPrice?: number
  /** When true, show a small “Price for this option” label above the main figures. */
  multivariant?: boolean
  showTaxNote?: boolean
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function PriceDisplay({
  basePrice,
  finalPrice,
  discountPercentage,
  fromFinalPrice,
  multivariant = false,
  showTaxNote = true,
}: Props) {
  const hasDiscount = discountPercentage > 0 && basePrice > finalPrice
  const floor = fromFinalPrice != null && fromFinalPrice > 0 ? fromFinalPrice : finalPrice

  return (
    <div className="font-ui">
      {multivariant ? (
        <div className="mb-2 text-xs font-semibold text-[rgb(var(--muted))]">Starting from {formatMoney(floor)}</div>
      ) : null}
      {multivariant ? (
        <div className="text-[11px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
          Price for this option
        </div>
      ) : null}
      <div className={`flex flex-wrap items-baseline gap-3 ${multivariant ? 'mt-1' : ''}`}>
        <div className="font-header text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-4xl">
          {formatMoney(finalPrice)}
        </div>
        {hasDiscount ? (
          <>
            <div className="text-sm font-medium text-[rgb(var(--muted))] line-through">{formatMoney(basePrice)}</div>
            <div className="rounded-full border border-emerald-500/35 bg-emerald-950/45 px-3 py-1 text-xs font-semibold text-emerald-100">
              {discountPercentage}% OFF
            </div>
          </>
        ) : null}
      </div>
      {showTaxNote ? (
        <div className="mt-2 text-xs text-[rgb(var(--muted))]">Inclusive of all taxes</div>
      ) : null}
    </div>
  )
}
