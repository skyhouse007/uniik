import type { Product, ProductVariant } from '../types/catalog'

export function productUsesSimpleCustom(p: Pick<Product, 'simpleCustomPricing'> | null | undefined): boolean {
  const sc = p?.simpleCustomPricing
  return !!(sc?.enabled && Number(sc.pricePerCubicInch) > 0 && (sc.thicknessOptions?.length ?? 0) > 0)
}

/** Mirrors backend `buildSimpleCustomVirtualVariant` for PDP / cart client checks. */
export function buildSimpleCustomVirtualVariant(p: Product, thicknessStr: string): ProductVariant | null {
  const sc = p.simpleCustomPricing
  if (!productUsesSimpleCustom(p) || !sc) return null
  const opts = sc.thicknessOptions ?? []
  const th = String(thicknessStr ?? '').trim()
  if (!th || !opts.some((o) => String(o).trim() === th)) return null

  let minL = Math.min(240, Math.max(1, Math.floor(Number(sc.customMinLengthIn) || 60)))
  let maxL = Math.min(240, Math.max(1, Math.floor(Number(sc.customMaxLengthIn) || 84)))
  let minW = Math.min(240, Math.max(1, Math.floor(Number(sc.customMinWidthIn) || 24)))
  let maxW = Math.min(240, Math.max(1, Math.floor(Number(sc.customMaxWidthIn) || 78)))
  if (maxL < minL) [minL, maxL] = [maxL, minL]
  if (maxW < minW) [minW, maxW] = [maxW, minW]

  let minVol = Math.floor(Number(sc.customMinVolumeCuIn) || 0)
  let maxVol = Math.floor(Number(sc.customMaxVolumeCuIn) || 0)
  if (minVol > 0 && maxVol > 0) {
    if (maxVol < minVol) [minVol, maxVol] = [maxVol, minVol]
    minVol = Math.min(10_000_000, Math.max(1, minVol))
    maxVol = Math.min(10_000_000, Math.max(1, maxVol))
  } else {
    minVol = 0
    maxVol = 0
  }

  const targetCat = String(sc.variantCategory ?? 'Custom').trim() || 'Custom'
  return {
    variantCategory: targetCat,
    pricingMode: 'custom_volume',
    pricePerCubicInch: Number(sc.pricePerCubicInch),
    pricePerSqInch: 0,
    customMinLengthIn: minL,
    customMaxLengthIn: maxL,
    customMinWidthIn: minW,
    customMaxWidthIn: maxW,
    customMinVolumeCuIn: minVol,
    customMaxVolumeCuIn: maxVol,
    size: 'custom',
    thickness: th,
    price: 0,
    discountPercentage: Math.min(100, Math.max(0, Number(sc.discountPercentage) || 0)),
    finalPrice: 0,
    stock: Math.max(0, Math.floor(Number(sc.stock) ?? 999)),
    isPopular: false,
  }
}

export function productPrimaryImage(p: Product) {
  return p.thumbnail || p.images?.[0]
}

export function computeVariantFinalPrice(price: number, discountPercentage: number) {
  const d = Math.min(100, Math.max(0, discountPercentage || 0))
  return Math.max(0, Math.round(price - (price * d) / 100))
}

export function parseThicknessInches(thicknessStr: string): number {
  const m = String(thicknessStr ?? '').match(/(\d+(?:\.\d+)?)/)
  const n = m ? Number(m[1]) : NaN
  if (!Number.isFinite(n) || n <= 0) return 6
  return Math.min(24, Math.max(0.5, n))
}

/** Custom row: catalog `size` is `custom` (volume, legacy area, or both). */
export function isCustomAreaVariant(
  v: Pick<ProductVariant, 'pricingMode' | 'pricePerSqInch' | 'pricePerCubicInch' | 'size'> | undefined,
) {
  if (String(v?.size ?? '').toLowerCase() !== 'custom') return false
  if (v?.pricingMode === 'custom_volume' && Number(v?.pricePerCubicInch) > 0) return true
  if (v?.pricingMode === 'custom_area' && Number(v?.pricePerSqInch) > 0) return true
  return false
}

/** Pool = variants already filtered by category. */
export function isCustomOnlyVariantPool(pool: ProductVariant[]) {
  return pool.length > 0 && pool.every((v) => isCustomAreaVariant(v))
}

export function parseMattressSizeInches(sizeStr: string): { lengthIn: number; widthIn: number } | null {
  const s = String(sizeStr ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
  const m = s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/)
  if (!m) return null
  const lengthIn = Number(m[1])
  const widthIn = Number(m[2])
  if (!Number.isFinite(lengthIn) || !Number.isFinite(widthIn) || lengthIn <= 0 || widthIn <= 0) return null
  return { lengthIn, widthIn }
}

/** Explicit or derived min/max volume (cu.in.) for custom_volume. */
export function variantVolumeBounds(v: ProductVariant) {
  const minVc = Number(v.customMinVolumeCuIn)
  const maxVc = Number(v.customMaxVolumeCuIn)
  if (minVc > 0 && maxVc > 0) {
    let mn = minVc
    let mx = maxVc
    if (mx < mn) [mn, mx] = [mx, mn]
    return { minV: mn, maxV: mx }
  }
  const { minL, maxL, minW, maxW } = variantBounds(v)
  const t = parseThicknessInches(v.thickness)
  return { minV: minL * minW * t, maxV: maxL * maxW * t }
}

/**
 * `v12345` = 12345 cu.in. Legacy `72x48` + thickness → L×W×T for old cart lines.
 */
export function parseMattressVolumeCuIn(sizeStr: string, thicknessForLegacy?: string): number | null {
  const s = String(sizeStr ?? '').trim().toLowerCase()
  const mv = /^v(\d+(?:\.\d+)?)$/.exec(s)
  if (mv) {
    const vol = Number(mv[1])
    return Number.isFinite(vol) && vol > 0 ? vol : null
  }
  if (thicknessForLegacy) {
    const lw = parseMattressSizeInches(sizeStr)
    if (lw) {
      const t = parseThicknessInches(thicknessForLegacy)
      return lw.lengthIn * lw.widthIn * t
    }
  }
  return null
}

export function customVolumeWithinBounds(v: ProductVariant, volumeCuIn: number) {
  if (!(v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0)) return true
  const { minV, maxV } = variantVolumeBounds(v)
  return volumeCuIn >= minV && volumeCuIn <= maxV
}

export function clampCustomVolume(v: ProductVariant, volume: number): number {
  const { minV, maxV } = variantVolumeBounds(v)
  return Math.min(maxV, Math.max(minV, Math.round(volume)))
}

export function defaultCustomVolumeToken(v: ProductVariant): string {
  const { minV } = variantVolumeBounds(v)
  return `v${Math.round(minV)}`
}

export function variantBounds(v: ProductVariant) {
  return {
    minL: v.customMinLengthIn != null && v.customMinLengthIn > 0 ? v.customMinLengthIn : 60,
    maxL: v.customMaxLengthIn != null && v.customMaxLengthIn > 0 ? v.customMaxLengthIn : 84,
    minW: v.customMinWidthIn != null && v.customMinWidthIn > 0 ? v.customMinWidthIn : 24,
    maxW: v.customMaxWidthIn != null && v.customMaxWidthIn > 0 ? v.customMaxWidthIn : 78,
  }
}

export function customSizeWithinBounds(v: ProductVariant, lengthIn: number, widthIn: number) {
  if (!(v.pricingMode === 'custom_area' && Number(v.pricePerSqInch) > 0)) return true
  const { minL, maxL, minW, maxW } = variantBounds(v)
  return lengthIn >= minL && lengthIn <= maxL && widthIn >= minW && widthIn <= maxW
}

export function defaultCustomSizeString(v: ProductVariant) {
  const { minL, minW } = variantBounds(v)
  return `${Math.round(minL)}x${Math.round(minW)}`
}

/** Legacy `custom_area`: clamp L×W to catalog bounds. */
export function clampCustomDimensions(v: ProductVariant, lengthIn: number, widthIn: number) {
  const { minL, maxL, minW, maxW } = variantBounds(v)
  return {
    lengthIn: Math.min(maxL, Math.max(minL, Math.round(lengthIn))),
    widthIn: Math.min(maxW, Math.max(minW, Math.round(widthIn))),
  }
}

/**
 * Selling price for PDP / cart line.
 * custom_volume: `selectedSize` is `LxW` inches; volume = L×W×thickness; price = rate × volume. `v12345` still supported.
 */
export function variantDisplayPrice(v: ProductVariant, selectedSize: string): number {
  if (v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0) {
    const vol = parseMattressVolumeCuIn(selectedSize, v.thickness)
    if (vol == null) return 0
    if (!customVolumeWithinBounds(v, vol)) return 0
    const base = (v.pricePerCubicInch ?? 0) * vol
    return computeVariantFinalPrice(base, v.discountPercentage ?? 0)
  }
  if (v.pricingMode === 'custom_area' && Number(v.pricePerSqInch) > 0) {
    const d = parseMattressSizeInches(selectedSize)
    if (!d) return 0
    if (!customSizeWithinBounds(v, d.lengthIn, d.widthIn)) return 0
    const base = (v.pricePerSqInch ?? 0) * d.lengthIn * d.widthIn
    return computeVariantFinalPrice(base, v.discountPercentage ?? 0)
  }
  return variantEffectiveFinal(v)
}

/** Base MRP before discount (for strikethrough on PDP). */
export function variantDisplayBasePrice(v: ProductVariant, selectedSize: string): number {
  if (v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0) {
    const vol = parseMattressVolumeCuIn(selectedSize, v.thickness)
    if (vol == null || !customVolumeWithinBounds(v, vol)) return 0
    return Math.max(0, Math.round((v.pricePerCubicInch ?? 0) * vol))
  }
  if (v.pricingMode === 'custom_area' && Number(v.pricePerSqInch) > 0) {
    const d = parseMattressSizeInches(selectedSize)
    if (!d || !customSizeWithinBounds(v, d.lengthIn, d.widthIn)) return 0
    return Math.max(0, Math.round((v.pricePerSqInch ?? 0) * d.lengthIn * d.widthIn))
  }
  return Math.max(0, Math.round(v.price ?? 0))
}

/** Selling price: prefer persisted `finalPrice` when valid; else same formula as backend. */
export function variantEffectiveFinal(v: Pick<ProductVariant, 'price' | 'discountPercentage' | 'finalPrice'>): number {
  const fp = v.finalPrice
  const price = v.price ?? 0
  if (typeof fp === 'number' && Number.isFinite(fp) && fp > 0) {
    return Math.round(fp)
  }
  if (typeof fp === 'number' && Number.isFinite(fp) && fp === 0 && price === 0) {
    return 0
  }
  return computeVariantFinalPrice(price, v.discountPercentage ?? 0)
}

export function simpleCustomTargetCategory(p: Pick<Product, 'simpleCustomPricing'> | null | undefined): string {
  const sc = p?.simpleCustomPricing
  return String(sc?.variantCategory ?? 'Custom').trim() || 'Custom'
}

/** Product-level simple custom applies to this mattress type (legacy: target Custom + cart ""). */
export function simpleCustomCategoryMatches(
  p: Pick<Product, 'simpleCustomPricing' | 'variants'> | null | undefined,
  variantCategory: string,
): boolean {
  if (!productUsesSimpleCustom(p)) return false
  const cat = String(variantCategory ?? '').trim()
  const target = simpleCustomTargetCategory(p)
  if (cat === target) return true
  if (target === 'Custom' && cat === '') return true
  return false
}

/** Min customer price for “cheapest variant” selection; virtual custom rows have finalPrice 0 in the client. */
function shelfComparablePrice(v: ProductVariant): number {
  if (v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0) {
    const size = defaultCustomSizeString(v)
    const vol = parseMattressVolumeCuIn(size, v.thickness)
    if (vol == null || !customVolumeWithinBounds(v, vol)) return 0
    return variantDisplayPrice(v, size)
  }
  if (v.pricingMode === 'custom_area' && Number(v.pricePerSqInch) > 0) {
    return variantDisplayPrice(v, defaultCustomSizeString(v))
  }
  return variantEffectiveFinal(v)
}

export function productMinVariant(p: Product): ProductVariant | null {
  const candidates: ProductVariant[] = []
  if (p.variants?.length) {
    for (const v of p.variants) candidates.push(v)
  }
  if (productUsesSimpleCustom(p)) {
    const t = p.simpleCustomPricing?.thicknessOptions?.[0]
    const v = t ? buildSimpleCustomVirtualVariant(p, t) : null
    if (v) candidates.push(v)
  }
  if (!candidates.length) return null
  return candidates.reduce((a, b) =>
    shelfComparablePrice(a) <= shelfComparablePrice(b) ? a : b,
  )
}

export function normVariantCategory(v: Pick<ProductVariant, 'variantCategory'> | undefined) {
  return String(v?.variantCategory ?? '').trim()
}

/** Default PDP selection: cheapest variant; custom rows use min L×W (volume priced via L×W×thickness). */
export function productCheapestSelection(
  p: Product,
): { variantCategory: string; size: string; thickness: string } | null {
  const v = productMinVariant(p)
  if (!v) return null
  let size = v.size
  if (v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0) {
    size = defaultCustomSizeString(v)
  } else if (v.pricingMode === 'custom_area' && Number(v.pricePerSqInch) > 0) {
    size = defaultCustomSizeString(v)
  }
  return { variantCategory: normVariantCategory(v), size, thickness: v.thickness }
}

export function findProductVariant(
  p: Product,
  variantCategory: string,
  size: string,
  thickness: string,
): ProductVariant | undefined {
  const cat = String(variantCategory ?? '').trim()
  const variants = p.variants ?? []
  for (const v of variants) {
    if (normVariantCategory(v) !== cat || v.thickness !== thickness) continue
    if (v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0) {
      const vol = parseMattressVolumeCuIn(size, v.thickness)
      if (vol == null) continue
      if (!customVolumeWithinBounds(v, vol)) continue
      return v
    }
    if (v.pricingMode === 'custom_area' && Number(v.pricePerSqInch) > 0) {
      const d = parseMattressSizeInches(size)
      if (!d) continue
      if (!customSizeWithinBounds(v, d.lengthIn, d.widthIn)) continue
      return v
    }
    if (v.size === size) return v
  }
  if (simpleCustomCategoryMatches(p, cat)) {
    const v = buildSimpleCustomVirtualVariant(p, thickness)
    if (!v) return undefined
    const vol = parseMattressVolumeCuIn(size, thickness)
    if (vol == null || !customVolumeWithinBounds(v, vol)) return undefined
    return v
  }
  return undefined
}

/** True if any variant uses a named category (vs legacy flat list), or simple custom names a type. */
export function productUsesVariantCategories(p: Product): boolean {
  if ((p.variants ?? []).some((v) => normVariantCategory(v) !== '')) return true
  if (productUsesSimpleCustom(p)) return true
  return false
}
