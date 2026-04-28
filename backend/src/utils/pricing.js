/**
 * @param {number} price
 * @param {number} discountPercentage
 */
export function computeFinalPrice(price, discountPercentage) {
  const p = Math.max(0, Number(price) || 0)
  const d = Math.min(100, Math.max(0, Number(discountPercentage) || 0))
  return Math.max(0, Math.round(p - (p * d) / 100))
}

/** @param {string} sizeStr e.g. "72x48" or "72 x 60" */
export function parseMattressSizeInches(sizeStr) {
  const s = String(sizeStr ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
  const m = s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/)
  if (!m) return null
  const lengthIn = Number(m[1])
  const widthIn = Number(m[2])
  if (!Number.isFinite(lengthIn) || !Number.isFinite(widthIn) || lengthIn <= 0 || widthIn <= 0) {
    return null
  }
  return { lengthIn, widthIn }
}

/** First numeric thickness in inches from labels like "6 inch", "8inch", "10". */
export function parseThicknessInches(thicknessStr) {
  const m = String(thicknessStr ?? '').match(/(\d+(?:\.\d+)?)/)
  const n = m ? Number(m[1]) : NaN
  if (!Number.isFinite(n) || n <= 0) return 6
  return Math.min(24, Math.max(0.5, n))
}

/** @param {Record<string, unknown>} v */
function legacyVariantLWBounds(v) {
  return {
    minL: Number(v.customMinLengthIn) > 0 ? Number(v.customMinLengthIn) : 60,
    maxL: Number(v.customMaxLengthIn) > 0 ? Number(v.customMaxLengthIn) : 84,
    minW: Number(v.customMinWidthIn) > 0 ? Number(v.customMinWidthIn) : 24,
    maxW: Number(v.customMaxWidthIn) > 0 ? Number(v.customMaxWidthIn) : 78,
  }
}

/**
 * Allowed volume (cu.in.) for custom_volume rows: explicit min/max, else L×W×T from legacy bounds.
 * @param {Record<string, unknown>} v
 */
export function variantVolumeBounds(v) {
  const minVc = Number(v.customMinVolumeCuIn)
  const maxVc = Number(v.customMaxVolumeCuIn)
  if (minVc > 0 && maxVc > 0) {
    let mn = minVc
    let mx = maxVc
    if (mx < mn) [mn, mx] = [mx, mn]
    return { minV: mn, maxV: mx }
  }
  const { minL, maxL, minW, maxW } = legacyVariantLWBounds(v)
  const t = parseThicknessInches(v.thickness)
  return { minV: minL * minW * t, maxV: maxL * maxW * t }
}

/**
 * Cart / PDP size token: `v12345` = 12345 cu.in. Legacy `72x48` + thickness → volume for old links.
 * @param {string} sizeStr
 * @param {string} [thicknessForLegacyLw]
 */
export function parseMattressVolumeCuIn(sizeStr, thicknessForLegacyLw) {
  const s = String(sizeStr ?? '').trim().toLowerCase()
  const mv = /^v(\d+(?:\.\d+)?)$/.exec(s)
  if (mv) {
    const vol = Number(mv[1])
    return Number.isFinite(vol) && vol > 0 ? vol : null
  }
  const lw = parseMattressSizeInches(sizeStr)
  if (lw && thicknessForLegacyLw) {
    const t = parseThicknessInches(thicknessForLegacyLw)
    return lw.lengthIn * lw.widthIn * t
  }
  return null
}

/** @param {Record<string, unknown>} v */
function isCustomVolumeVariant(v) {
  return v?.pricingMode === 'custom_volume' && Number(v?.pricePerCubicInch) > 0
}

/** @param {Record<string, unknown>} v */
function isCustomAreaVariant(v) {
  return v?.pricingMode === 'custom_area' && Number(v?.pricePerSqInch) > 0
}

/** Custom row: catalog `size` is `custom`. */
function isCustomDimensionalVariant(v) {
  if (String(v?.size ?? '').toLowerCase() !== 'custom') return false
  return isCustomVolumeVariant(v) || isCustomAreaVariant(v)
}

/**
 * Product-level “any size” pricing: one ₹/cu.in, no variant rows.
 * @param {Record<string, unknown>} productLean
 * @param {string} thicknessStr — must match an entry in `thicknessOptions`
 * @returns {Record<string, unknown>|null}
 */
export function buildSimpleCustomVirtualVariant(productLean, thicknessStr) {
  const sc = productLean?.simpleCustomPricing
  if (!sc || !sc.enabled || Number(sc.pricePerCubicInch) <= 0) return null
  const opts = Array.isArray(sc.thicknessOptions) ? sc.thicknessOptions : []
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

/** @param {Record<string, unknown>} v */
export function customVolumeWithinBounds(v, volumeCuIn) {
  if (!isCustomVolumeVariant(v)) return true
  const { minV, maxV } = variantVolumeBounds(v)
  return volumeCuIn >= minV && volumeCuIn <= maxV
}

/** @param {Record<string, unknown>} v */
export function customSizeWithinBounds(v, lengthIn, widthIn) {
  if (!isCustomAreaVariant(v)) return true
  const { minL, maxL, minW, maxW } = legacyVariantLWBounds(v)
  return lengthIn >= minL && lengthIn <= maxL && widthIn >= minW && widthIn <= maxW
}

/**
 * Base MRP before discount (fixed price, or volume × ₹/cu.in, or legacy area × rate).
 * @param {Record<string, unknown>} v
 */
export function computeVariantBasePrice(v, sizeStr) {
  if (isCustomVolumeVariant(v)) {
    const vol = parseMattressVolumeCuIn(sizeStr, v.thickness)
    if (vol == null) return 0
    if (!customVolumeWithinBounds(v, vol)) return 0
    return Number(v.pricePerCubicInch) * vol
  }
  if (isCustomAreaVariant(v)) {
    const d = parseMattressSizeInches(sizeStr)
    if (!d) return 0
    return Number(v.pricePerSqInch) * d.lengthIn * d.widthIn
  }
  return Number(v.price) || 0
}

/**
 * Final unit price for cart / checkout validation.
 * @param {Record<string, unknown>} v
 */
export function computeVariantUnitPrice(v, sizeStr) {
  return computeFinalPrice(computeVariantBasePrice(v, sizeStr), v.discountPercentage)
}

/**
 * @param {{ variants?: Array<Record<string, unknown>> }} productLean
 * @param {string} size — preset SKU, `v12345` cu.in., or legacy `72x48` for custom_volume
 * @param {string} thickness
 * @param {string} [variantCategory] — empty string matches variants with no category (legacy)
 */
function simpleCustomCategoryMatches(productLean, selectedCat) {
  const sc = productLean?.simpleCustomPricing
  if (!sc?.enabled || Number(sc.pricePerCubicInch) <= 0) return false
  const cat = String(selectedCat ?? '').trim()
  const target = String(sc.variantCategory ?? 'Custom').trim() || 'Custom'
  if (cat === target) return true
  if (target === 'Custom' && cat === '') return true
  return false
}

/**
 * Prefer explicit variant rows; then product-level simple custom for the configured mattress type.
 */
export function findVariant(productLean, size, thickness, variantCategory = '') {
  const cat = String(variantCategory ?? '').trim()
  const variants = productLean?.variants ?? []
  for (const v of variants) {
    const vc = String(v.variantCategory ?? '').trim()
    if (vc !== cat || v.thickness !== thickness) continue
    if (isCustomVolumeVariant(v)) {
      const vol = parseMattressVolumeCuIn(size, v.thickness)
      if (vol == null) continue
      if (!customVolumeWithinBounds(v, vol)) continue
      return v
    }
    if (isCustomAreaVariant(v)) {
      const d = parseMattressSizeInches(size)
      if (!d) continue
      if (!customSizeWithinBounds(v, d.lengthIn, d.widthIn)) continue
      return v
    }
    if (v.size === size) return v
  }

  const vSimple = buildSimpleCustomVirtualVariant(productLean, thickness)
  if (!vSimple || !simpleCustomCategoryMatches(productLean, cat)) return null
  const vol = parseMattressVolumeCuIn(size, thickness)
  if (vol == null || !customVolumeWithinBounds(vSimple, vol)) return null
  return vSimple
}
