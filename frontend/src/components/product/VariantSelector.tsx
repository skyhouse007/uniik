import type { Product, ProductVariant } from '../../types/catalog'
import {
  buildSimpleCustomVirtualVariant,
  defaultCustomSizeString,
  isCustomAreaVariant,
  isCustomOnlyVariantPool,
  parseThicknessInches,
  productUsesSimpleCustom,
  productUsesVariantCategories,
  simpleCustomTargetCategory,
  variantBounds,
} from '../../utils/product'

function normCat(raw: string | undefined) {
  return String(raw ?? '').trim()
}

function categoryButtonLabel(c: string) {
  return normCat(c) === '' ? 'Standard' : c
}

/** Show standard types first, then others A–Z, Custom last (matches common mattress flows). */
const STANDARD_TYPE_ORDER = ['Single', 'Double', 'Queen', 'King'] as const

function sortCategoryOrder(categories: string[]): string[] {
  const uniq = [...new Map(categories.map((c) => [normCat(c), c])).values()]
  const legacy = uniq.filter((c) => normCat(c) === '')
  const custom = uniq.filter((c) => normCat(c) === 'Custom')
  const standard = uniq.filter((c) => STANDARD_TYPE_ORDER.includes(normCat(c) as (typeof STANDARD_TYPE_ORDER)[number]))
  const other = uniq.filter(
    (c) =>
      normCat(c) !== '' &&
      normCat(c) !== 'Custom' &&
      !STANDARD_TYPE_ORDER.includes(normCat(c) as (typeof STANDARD_TYPE_ORDER)[number]),
  )
  standard.sort(
    (a, b) =>
      STANDARD_TYPE_ORDER.indexOf(normCat(a) as (typeof STANDARD_TYPE_ORDER)[number]) -
      STANDARD_TYPE_ORDER.indexOf(normCat(b) as (typeof STANDARD_TYPE_ORDER)[number]),
  )
  other.sort((a, b) => normCat(a).localeCompare(normCat(b)))
  return [...legacy, ...standard, ...other, ...custom]
}

type Props = {
  product: Product
  selectedVariantCategory: string
  selectedSize: string
  selectedThickness: string
  onVariantCategoryChange: (category: string) => void
  onSizeChange: (size: string) => void
  onThicknessChange: (thickness: string) => void
  /** Custom length × width (inches); with thickness, price = ₹/cu.in × L × W × T. */
  customLength: string
  customWidth: string
  onCustomLengthChange: (value: string) => void
  onCustomWidthChange: (value: string) => void
}

function clampLwOnBlur(
  customTemplate: ProductVariant,
  customLength: string,
  customWidth: string,
  onCustomLengthChange: (v: string) => void,
  onCustomWidthChange: (v: string) => void,
) {
  const def = defaultCustomSizeString(customTemplate)
  const p = def.split('x')
  const l = Number(customLength)
  const w = Number(customWidth)
  const { minL, maxL, minW, maxW } = variantBounds(customTemplate)
  const nl = Number.isFinite(l) ? Math.min(maxL, Math.max(minL, Math.round(l))) : Number(p[0])
  const nw = Number.isFinite(w) ? Math.min(maxW, Math.max(minW, Math.round(w))) : Number(p[1])
  onCustomLengthChange(String(nl))
  onCustomWidthChange(String(nw))
}

export function VariantSelector({
  product,
  selectedVariantCategory,
  selectedSize,
  selectedThickness,
  onVariantCategoryChange,
  onSizeChange,
  onThicknessChange,
  customLength,
  customWidth,
  onCustomLengthChange,
  onCustomWidthChange,
}: Props) {
  const useCats = productUsesVariantCategories(product)
  const rawVariants = product.variants ?? []
  const simpleTarget = simpleCustomTargetCategory(product)
  const hasSimple = productUsesSimpleCustom(product)

  let variants: ProductVariant[] = rawVariants
  if (hasSimple) {
    const poolForSimple = rawVariants.filter((v) => normCat(v.variantCategory) === normCat(simpleTarget))
    const hasVariantCustomVol = poolForSimple.some(
      (v) => v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0,
    )
    if (!hasVariantCustomVol) {
      const synth = (product.simpleCustomPricing?.thicknessOptions ?? [])
        .map((t) => buildSimpleCustomVirtualVariant(product, t))
        .filter((x): x is NonNullable<typeof x> => x != null)
      const other = rawVariants.filter((v) => normCat(v.variantCategory) !== normCat(simpleTarget))
      variants = [...other, ...synth]
    }
  }

  const categoryOrder: string[] = []
  const seenCat = new Set<string>()
  for (const v of variants) {
    const c = normCat(v.variantCategory)
    if (!seenCat.has(c)) {
      seenCat.add(c)
      categoryOrder.push(c)
    }
  }
  if (hasSimple && !seenCat.has(normCat(simpleTarget))) {
    categoryOrder.push(simpleTarget)
  }

  const sortedCategoryOrder = sortCategoryOrder(categoryOrder)

  const pool = useCats
    ? variants.filter((v) => normCat(v.variantCategory) === normCat(selectedVariantCategory))
    : variants

  const customOnly = isCustomOnlyVariantPool(pool) || (!useCats && isCustomOnlyVariantPool(variants))
  const effectivePool = !useCats && isCustomOnlyVariantPool(variants) ? variants : pool
  const customTemplate =
    effectivePool.find((v) => v.thickness === selectedThickness) ?? effectivePool[0]

  const isVolumeCustom =
    !!customTemplate &&
    Number(customTemplate.pricePerCubicInch) > 0 &&
    customTemplate.pricingMode !== 'custom_area'
  const isAreaCustom =
    !!customTemplate &&
    customTemplate.pricingMode === 'custom_area' &&
    Number(customTemplate.pricePerSqInch) > 0

  const dimBounds =
    customTemplate && (isVolumeCustom || isAreaCustom) && isCustomAreaVariant(customTemplate)
      ? variantBounds(customTemplate)
      : null

  const tIn = customTemplate ? parseThicknessInches(selectedThickness) : 6
  const volPreview =
    isVolumeCustom && customTemplate
      ? Math.round((Number(customLength) || 0) * (Number(customWidth) || 0) * tIn)
      : null

  const sizes = [...new Set(effectivePool.map((v) => v.size))]
  const thicknessesForSize = customOnly
    ? effectivePool.map((v) => v.thickness)
    : effectivePool.filter((v) => v.size === selectedSize).map((v) => v.thickness)
  const uniqueThicknesses = [...new Set(thicknessesForSize)]

  const activeCategoryLabel = categoryButtonLabel(selectedVariantCategory)

  const customLwBlock = customOnly && (isVolumeCustom || isAreaCustom) && customTemplate && (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Custom size (inches)
      </div>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        {isVolumeCustom ? (
          <>
            Enter length and width. Price uses the rate set in the catalog (₹ per cu.in) × length × width ×
            thickness — choose thickness below.
            {dimBounds
              ? ` Allowed ~${dimBounds.minL}–${dimBounds.maxL}" × ${dimBounds.minW}–${dimBounds.maxW}".`
              : ''}
            {volPreview != null && volPreview > 0 ? (
              <span className="mt-1 block text-[10px] text-[rgb(var(--muted))]">
                Volume with current thickness: ~{volPreview.toLocaleString('en-IN')} cu.in.
              </span>
            ) : null}
          </>
        ) : (
          <>
            Enter length and width. Price = ₹ per sq.in × L × W (legacy).
            {dimBounds
              ? ` Allowed ~${dimBounds.minL}–${dimBounds.maxL}" × ${dimBounds.minW}–${dimBounds.maxW}".`
              : ''}
          </>
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[rgb(var(--muted))]" htmlFor="custom-len">
            Length
          </label>
          <input
            id="custom-len"
            type="number"
            inputMode="decimal"
            min={dimBounds?.minL}
            max={dimBounds?.maxL}
            value={customLength}
            onChange={(e) => onCustomLengthChange(e.target.value)}
            onBlur={() => clampLwOnBlur(customTemplate, customLength, customWidth, onCustomLengthChange, onCustomWidthChange)}
            className="w-28 rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
          />
        </div>
        <span className="pb-2 text-sm text-[rgb(var(--muted))]">×</span>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[rgb(var(--muted))]" htmlFor="custom-wid">
            Width
          </label>
          <input
            id="custom-wid"
            type="number"
            inputMode="decimal"
            min={dimBounds?.minW}
            max={dimBounds?.maxW}
            value={customWidth}
            onChange={(e) => onCustomWidthChange(e.target.value)}
            onBlur={() => clampLwOnBlur(customTemplate, customLength, customWidth, onCustomLengthChange, onCustomWidthChange)}
            className="w-28 rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-[rgb(var(--fg))]">Choose configuration</div>
      <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">
        {useCats
          ? 'Choose a mattress type. Custom is for made-to-order sizes (length × width) when available.'
          : 'Pick size and thickness for this product.'}
      </p>

      {useCats ? (
        <>
          <div className="mt-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--muted))]">Type</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sortedCategoryOrder.map((c) => {
                const label = categoryButtonLabel(c)
                return (
                  <button
                    key={c || '__default__'}
                    type="button"
                    onClick={() => onVariantCategoryChange(c)}
                    className={[
                      'rounded-full border px-4 py-2 text-xs font-semibold transition',
                      normCat(selectedVariantCategory) === c
                        ? 'border-[rgb(var(--brand))] bg-[rgb(var(--surface))] text-[rgb(var(--brand))]'
                        : 'border-[rgb(var(--border))] bg-white hover:border-[rgb(var(--muted))]',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[rgb(var(--border))] border-l-[3px] border-l-[rgb(var(--brand))] bg-[rgb(var(--surface))] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--muted))]">Variants</div>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Showing options for{' '}
              <span className="font-semibold text-[rgb(var(--fg))]">{activeCategoryLabel}</span>.
            </p>

            <div className="mt-4 space-y-5 border-t border-[rgb(var(--border))] pt-4">
              {!customOnly ? (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    Size
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onSizeChange(s)}
                        className={[
                          'rounded-full border px-4 py-2 text-xs font-semibold transition',
                          selectedSize === s
                            ? 'border-[rgb(var(--brand))] bg-white text-[rgb(var(--brand))]'
                            : 'border-[rgb(var(--border))] bg-white hover:border-[rgb(var(--muted))]',
                        ].join(' ')}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                customLwBlock
              )}

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  Thickness
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {uniqueThicknesses.map((t) => {
                    const v = effectivePool.find((x) => x.thickness === t && (customOnly || x.size === selectedSize))
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onThicknessChange(t)}
                        className={[
                          'rounded-full border px-4 py-2 text-xs font-semibold transition',
                          selectedThickness === t
                            ? 'border-[rgb(var(--brand))] bg-white text-[rgb(var(--brand))]'
                            : 'border-[rgb(var(--border))] bg-white hover:border-[rgb(var(--muted))]',
                        ].join(' ')}
                      >
                        <span>{t}</span>
                        {v?.isPopular ? (
                          <span className="ml-2 rounded-full bg-[rgb(var(--brand))] px-2 py-0.5 text-[10px] font-bold text-white">
                            Popular
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-5">
          {!customOnly ? (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Size</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSizeChange(s)}
                    className={[
                      'rounded-full border px-4 py-2 text-xs font-semibold transition',
                      selectedSize === s
                        ? 'border-[rgb(var(--brand))] bg-[rgb(var(--surface))] text-[rgb(var(--brand))]'
                        : 'border-[rgb(var(--border))] bg-white hover:border-[rgb(var(--muted))]',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[rgb(var(--border))] border-l-[3px] border-l-[rgb(var(--brand))] bg-[rgb(var(--surface))] p-4">
              {customLwBlock}
              <div className={customLwBlock ? 'mt-5 border-t border-[rgb(var(--border))] pt-4' : ''}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  Thickness
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {uniqueThicknesses.map((t) => {
                    const v = effectivePool.find(
                      (x) => x.thickness === t && (customOnly || x.size === selectedSize),
                    )
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onThicknessChange(t)}
                        className={[
                          'rounded-full border px-4 py-2 text-xs font-semibold transition',
                          selectedThickness === t
                            ? 'border-[rgb(var(--brand))] bg-[rgb(var(--surface))] text-[rgb(var(--brand))]'
                            : 'border-[rgb(var(--border))] bg-white hover:border-[rgb(var(--muted))]',
                        ].join(' ')}
                      >
                        <span>{t}</span>
                        {v?.isPopular ? (
                          <span className="ml-2 rounded-full bg-[rgb(var(--brand))] px-2 py-0.5 text-[10px] font-bold text-white">
                            Popular
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {!customOnly ? (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Thickness
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueThicknesses.map((t) => {
                  const v = effectivePool.find(
                    (x) => x.thickness === t && (customOnly || x.size === selectedSize),
                  )
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onThicknessChange(t)}
                      className={[
                        'rounded-full border px-4 py-2 text-xs font-semibold transition',
                        selectedThickness === t
                          ? 'border-[rgb(var(--brand))] bg-[rgb(var(--surface))] text-[rgb(var(--brand))]'
                          : 'border-[rgb(var(--border))] bg-white hover:border-[rgb(var(--muted))]',
                      ].join(' ')}
                    >
                      <span>{t}</span>
                      {v?.isPopular ? (
                        <span className="ml-2 rounded-full bg-[rgb(var(--brand))] px-2 py-0.5 text-[10px] font-bold text-white">
                          Popular
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
