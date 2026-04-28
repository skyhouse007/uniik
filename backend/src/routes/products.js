import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Product } from '../models/Product.js'
import { Category } from '../models/Category.js'
import { requireClerkAuth } from '../middleware/auth.js'
import { requireAdminToken } from '../middleware/adminAuth.js'
import { Review } from '../models/Review.js'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { normalizePincode, resolveProductDelivery } from '../utils/productDelivery.js'

export const productsRouter = Router()

/** Product filter by parent category id also matches products in any descendant category. */
async function categoryIdsIncludingDescendants(rootIdRaw) {
  const rootId = String(rootIdRaw ?? '').trim()
  if (!rootId) return null
  if (!mongoose.Types.ObjectId.isValid(rootId)) return [rootId]

  const rows = await Category.find({}, { _id: 1, parentId: 1 }).lean()
  const byParent = new Map()
  for (const r of rows) {
    const pid = r.parentId ? String(r.parentId) : null
    if (!pid) continue
    if (!byParent.has(pid)) byParent.set(pid, [])
    byParent.get(pid).push(String(r._id))
  }

  const seen = new Set([rootId])
  const stack = [rootId]
  while (stack.length) {
    const cur = stack.pop()
    for (const childId of byParent.get(cur) ?? []) {
      if (!seen.has(childId)) {
        seen.add(childId)
        stack.push(childId)
      }
    }
  }
  return [...seen]
}

const VariantInput = z.object({
  /** Always persist (admin mattress type); empty = legacy flat list */
  variantCategory: z.string().default(''),
  pricingMode: z.enum(['standard', 'custom_area', 'custom_volume']).optional(),
  pricePerSqInch: z.number().nonnegative().optional(),
  pricePerCubicInch: z.number().nonnegative().optional(),
  customMinLengthIn: z.number().min(1).max(240).optional(),
  customMaxLengthIn: z.number().min(1).max(240).optional(),
  customMinWidthIn: z.number().min(1).max(240).optional(),
  customMaxWidthIn: z.number().min(1).max(240).optional(),
  customMinVolumeCuIn: z.number().min(0).max(10_000_000).optional(),
  customMaxVolumeCuIn: z.number().min(0).max(10_000_000).optional(),
  size: z.string().min(1),
  thickness: z.string().min(1),
  price: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0),
  isPopular: z.boolean().optional(),
})

const SpecInput = z.object({
  title: z.string().min(1),
  value: z.string().min(1),
})

/** Accept array (new admin) or legacy Record<string, string> from older clients / cached payloads */
const SpecificationsSchema = z
  .union([z.array(SpecInput), z.record(z.string(), z.string())])
  .optional()

const PincodeInput = z.object({
  pincode: z.string().min(3).max(10),
  deliveryDays: z.number().int().min(1).max(90),
})

const SimpleCustomPricingInput = z.object({
  enabled: z.boolean().optional(),
  /** Mattress type label for product-level simple custom (default Custom). */
  variantCategory: z.string().optional(),
  pricePerCubicInch: z.number().nonnegative().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  customMinLengthIn: z.number().min(1).max(240).optional(),
  customMaxLengthIn: z.number().min(1).max(240).optional(),
  customMinWidthIn: z.number().min(1).max(240).optional(),
  customMaxWidthIn: z.number().min(1).max(240).optional(),
  customMinVolumeCuIn: z.number().min(0).max(10_000_000).optional(),
  customMaxVolumeCuIn: z.number().min(0).max(10_000_000).optional(),
  thicknessOptions: z.preprocess(
    (v) => {
      if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
      if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean)
      return v
    },
    z.array(z.string().min(1)).optional(),
  ),
  stock: z.number().int().min(0).optional(),
})

/** No `.superRefine()` here — Zod 4 forbids `.partial()` on refined objects (PUT would throw). */
const ProductUpsertBaseSchema = z.object({
  productName: z.string().min(2),
  modelName: z.string().min(1),
  slug: z.union([z.string().min(2), z.literal('')]).optional(),
  category: z.string().min(1),
  shortDescription: z.string().min(5),
  fullDescription: z.string().min(10),
  images: z.array(z.string().url()).optional(),
  thumbnail: z.union([z.string().url(), z.literal('')]).optional(),
  model3DUrl: z.union([z.string().url(), z.literal('')]).optional(),
  /** Empty array is valid when `simpleCustomPricing` is enabled with rate + thickness options. */
  variants: z.array(VariantInput).min(0).max(500).default([]),
  simpleCustomPricing: SimpleCustomPricingInput.optional(),
  specifications: SpecificationsSchema,
  deliverablePincodes: z.array(PincodeInput).optional(),
  deliveryCenterPincode: z.union([z.string(), z.null()]).optional(),
  deliveryRadiusKm: z.union([z.number(), z.null()]).optional(),
  radiusDeliveryDays: z.union([z.number(), z.null()]).optional(),
  warrantyPeriod: z.string().min(1),
  deliveryTimeline: z.string().min(1),
  returnPolicy: z.string().min(1),
  brand: z.string().min(1),
  rating: z.number().min(0).max(5).optional(),
  firmness: z.enum(['soft', 'medium', 'firm']).optional(),
  popularity: z.number().int().min(0).optional(),
  promoBadgeType: z.enum(['best_seller', 'extra_offer', 'last_chance', 'trial_100_nights', 'custom']),
  promoBadgeText: z.string().min(1).max(80),
})

function simpleCustomPricingIsComplete(sc) {
  return (
    !!sc?.enabled &&
    Number(sc?.pricePerCubicInch) > 0 &&
    (Array.isArray(sc?.thicknessOptions) ? sc.thicknessOptions.length : 0) > 0
  )
}

/** Full create / replace body: need either variant rows or enabled simple custom. */
function assertVariantsOrSimpleCustomForCreate(data) {
  const hasVariants = (data.variants?.length ?? 0) > 0
  if (hasVariants || simpleCustomPricingIsComplete(data.simpleCustomPricing)) return
  const err = new Error(
    'Add variant rows or enable Simple custom pricing (₹ per cu.in + at least one thickness option).',
  )
  err.statusCode = 400
  err.issues = [{ path: ['variants'], message: err.message }]
  throw err
}

productsRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(48, Math.max(1, Number(req.query.limit ?? 12)))

    const q = (req.query.q ?? '').toString().trim()
    const category = (req.query.category ?? '').toString().trim()
    const brand = (req.query.brand ?? '').toString().trim()
    const size = (req.query.size ?? '').toString().trim()
    const firmness = (req.query.firmness ?? '').toString().trim()

    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined
    const minRating = req.query.minRating ? Number(req.query.minRating) : undefined

    const filter = {}
    if (q) filter.$text = { $search: q }
    if (category) {
      const expanded = await categoryIdsIncludingDescendants(category)
      if (expanded?.length) {
        filter.category = expanded.length === 1 ? expanded[0] : { $in: expanded }
      } else {
        filter.category = category
      }
    }
    if (brand) filter.brand = { $regex: brand, $options: 'i' }
    if (firmness) filter.firmness = firmness
    if (minRating) filter.rating = { ...(filter.rating ?? {}), $gte: minRating }

    const variantMatch = {}
    if (size) variantMatch.size = size
    if (minPrice != null || maxPrice != null) {
      variantMatch.finalPrice = {}
      if (minPrice != null) variantMatch.finalPrice.$gte = minPrice
      if (maxPrice != null) variantMatch.finalPrice.$lte = maxPrice
    }
    if (Object.keys(variantMatch).length) {
      filter.variants = { $elemMatch: variantMatch }
    }

    const sortKey = (req.query.sort ?? 'popularity').toString()
    const sort =
      sortKey === 'price_asc'
        ? { minFinalPrice: 1 }
        : sortKey === 'price_desc'
          ? { maxFinalPrice: -1 }
          : sortKey === 'rating_desc'
            ? { rating: -1, popularity: -1 }
            : sortKey === 'newest'
              ? { createdAt: -1 }
              : { popularity: -1, rating: -1 }

    const [items, total] = await Promise.all([
      Product.find(filter).populate('category').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ])

    res.json({ items, page, limit, total })
  } catch (e) {
    next(e)
  }
})

productsRouter.get('/:id/check-delivery', async (req, res, next) => {
  try {
    const pin = normalizePincode(req.query.pincode)
    if (!pin) return res.status(400).json({ ok: false, error: 'Invalid pincode' })

    const p = await Product.findById(req.params.id)
      .select('deliverablePincodes deliveryCenterPincode deliveryRadiusKm radiusDeliveryDays')
      .lean()
    if (!p) return res.status(404).json({ ok: false, error: 'Product not found' })

    const resolved = await resolveProductDelivery(p, pin)
    if (!resolved.ok) {
      return res.json({ ok: false, message: resolved.message ?? 'Sorry, delivery is not available in your area.' })
    }

    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + resolved.deliveryDays)
    res.json({
      ok: true,
      deliveryDays: resolved.deliveryDays,
      deliveryDate: deliveryDate.toISOString(),
      message: `Delivery by: ${deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}`,
    })
  } catch (e) {
    next(e)
  }
})

productsRouter.get('/:id/reviews', async (req, res, next) => {
  try {
    const items = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 }).limit(50).lean()
    res.json({ items })
  } catch (e) {
    next(e)
  }
})

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).populate('category').lean()
    if (!p) return res.status(404).json({ error: 'Product not found' })
    res.json(p)
  } catch (e) {
    next(e)
  }
})

const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(80).optional(),
  comment: z.string().min(5).max(1200),
})

productsRouter.post('/:id/reviews', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const payload = ReviewSchema.parse(req.body)
    const user = await clerkClient.users.getUser(userId)
    const userName =
      user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'

    const review = await Review.findOneAndUpdate(
      { productId: req.params.id, userId },
      { $set: { ...payload, userName, productId: req.params.id, userId } },
      { upsert: true, new: true },
    )

    const agg = await Review.aggregate([
      { $match: { productId: review.productId } },
      { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    const avg = agg?.[0]?.avg ?? 0
    const rounded = Math.round(avg * 10) / 10
    await Product.updateOne({ _id: req.params.id }, { $set: { rating: rounded } })

    res.status(201).json(review)
  } catch (e) {
    next(e)
  }
})

/** Partial updates: ignore "" so Zod doesn't run .min(1) on empty strings (admin form clears). */
function stripEmptyStringsFromPatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body
  const out = { ...body }
  for (const key of Object.keys(out)) {
    const v = out[key]
    if (typeof v === 'string' && v.trim() === '') {
      delete out[key]
    }
  }
  return out
}

function normalizeSpecifications(spec) {
  if (spec == null) return undefined
  if (Array.isArray(spec)) return spec
  if (typeof spec === 'object') {
    return Object.entries(spec).map(([title, value]) => ({
      title,
      value: String(value),
    }))
  }
  return undefined
}

function sanitizeSimpleCustomPricing(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      enabled: false,
      variantCategory: 'Custom',
      pricePerCubicInch: 0,
      discountPercentage: 0,
      customMinLengthIn: 60,
      customMaxLengthIn: 84,
      customMinWidthIn: 24,
      customMaxWidthIn: 78,
      customMinVolumeCuIn: 0,
      customMaxVolumeCuIn: 0,
      thicknessOptions: ['6 inch', '8 inch'],
      stock: 999,
    }
  }
  const enabled = !!raw.enabled
  const ppcu = Math.max(0, Number(raw.pricePerCubicInch) || 0)
  let opts = Array.isArray(raw.thicknessOptions)
    ? raw.thicknessOptions.map((x) => String(x).trim()).filter(Boolean)
    : []
  if (!opts.length) opts = ['6 inch', '8 inch']
  let minL = Math.min(240, Math.max(1, Math.floor(Number(raw.customMinLengthIn) || 60)))
  let maxL = Math.min(240, Math.max(1, Math.floor(Number(raw.customMaxLengthIn) || 84)))
  let minW = Math.min(240, Math.max(1, Math.floor(Number(raw.customMinWidthIn) || 24)))
  let maxW = Math.min(240, Math.max(1, Math.floor(Number(raw.customMaxWidthIn) || 78)))
  if (maxL < minL) [minL, maxL] = [maxL, minL]
  if (maxW < minW) [minW, maxW] = [maxW, minW]
  let minVol = Math.floor(Number(raw.customMinVolumeCuIn) || 0)
  let maxVol = Math.floor(Number(raw.customMaxVolumeCuIn) || 0)
  if (enabled && ppcu > 0 && minVol > 0 && maxVol > 0) {
    if (maxVol < minVol) [minVol, maxVol] = [maxVol, minVol]
    minVol = Math.min(10_000_000, Math.max(1, minVol))
    maxVol = Math.min(10_000_000, Math.max(1, maxVol))
  } else {
    minVol = 0
    maxVol = 0
  }
  const variantCategory = String(raw.variantCategory ?? 'Custom').trim() || 'Custom'
  return {
    enabled,
    variantCategory,
    pricePerCubicInch: enabled ? ppcu : 0,
    discountPercentage: Math.min(100, Math.max(0, Number(raw.discountPercentage) || 0)),
    customMinLengthIn: minL,
    customMaxLengthIn: maxL,
    customMinWidthIn: minW,
    customMaxWidthIn: maxW,
    customMinVolumeCuIn: enabled && ppcu > 0 ? minVol : 0,
    customMaxVolumeCuIn: enabled && ppcu > 0 ? maxVol : 0,
    thicknessOptions: opts,
    stock: Math.max(0, Math.floor(Number(raw.stock) ?? 999)),
  }
}

function sanitizeProductPayload(body) {
  const thumb = body.thumbnail?.trim() ? body.thumbnail.trim() : undefined
  const model = body.model3DUrl?.trim() ? body.model3DUrl.trim() : undefined
  const out = { ...body }
  if (thumb !== undefined) out.thumbnail = thumb
  if (model !== undefined) out.model3DUrl = model
  if (Object.prototype.hasOwnProperty.call(body, 'simpleCustomPricing')) {
    out.simpleCustomPricing = sanitizeSimpleCustomPricing(body.simpleCustomPricing)
  }
  if (Array.isArray(out.variants)) {
    out.variants = out.variants.map((v) => {
      const ppcu = Math.max(0, Number(v?.pricePerCubicInch) || 0)
      const ppsi = Math.max(0, Number(v?.pricePerSqInch) || 0)
      const wantsVol = v?.pricingMode === 'custom_volume' && ppcu > 0
      const wantsArea = v?.pricingMode === 'custom_area' && ppsi > 0 && !wantsVol
      const isCustom = wantsVol || wantsArea
      const row = {
        variantCategory: String(v?.variantCategory ?? '').trim(),
        pricingMode: wantsVol ? 'custom_volume' : wantsArea ? 'custom_area' : 'standard',
        pricePerCubicInch: wantsVol ? ppcu : 0,
        pricePerSqInch: wantsArea ? ppsi : 0,
        size: isCustom ? 'custom' : String(v?.size ?? '').trim(),
        thickness: String(v?.thickness ?? '').trim(),
        price: isCustom ? 0 : Math.max(0, Number(v?.price) || 0),
        discountPercentage: Math.min(100, Math.max(0, Number(v?.discountPercentage) || 0)),
        stock: Math.max(0, Math.floor(Number(v?.stock) || 0)),
        isPopular: !!v?.isPopular,
      }
      if (isCustom) {
        let minL = Math.min(240, Math.max(1, Math.floor(Number(v?.customMinLengthIn) || 60)))
        let maxL = Math.min(240, Math.max(1, Math.floor(Number(v?.customMaxLengthIn) || 84)))
        let minW = Math.min(240, Math.max(1, Math.floor(Number(v?.customMinWidthIn) || 24)))
        let maxW = Math.min(240, Math.max(1, Math.floor(Number(v?.customMaxWidthIn) || 78)))
        if (maxL < minL) [minL, maxL] = [maxL, minL]
        if (maxW < minW) [minW, maxW] = [maxW, minW]
        let minVol = Math.floor(Number(v?.customMinVolumeCuIn) || 0)
        let maxVol = Math.floor(Number(v?.customMaxVolumeCuIn) || 0)
        if (wantsVol && minVol > 0 && maxVol > 0) {
          if (maxVol < minVol) [minVol, maxVol] = [maxVol, minVol]
          minVol = Math.min(10_000_000, Math.max(1, minVol))
          maxVol = Math.min(10_000_000, Math.max(1, maxVol))
        } else {
          minVol = 0
          maxVol = 0
        }
        return {
          ...row,
          customMinLengthIn: minL,
          customMaxLengthIn: maxL,
          customMinWidthIn: minW,
          customMaxWidthIn: maxW,
          customMinVolumeCuIn: wantsVol ? minVol : 0,
          customMaxVolumeCuIn: wantsVol ? maxVol : 0,
        }
      }
      return {
        ...row,
        customMinLengthIn: 60,
        customMaxLengthIn: 84,
        customMinWidthIn: 24,
        customMaxWidthIn: 78,
        customMinVolumeCuIn: 0,
        customMaxVolumeCuIn: 0,
      }
    })
  }
  if (body.specifications != null) {
    out.specifications = normalizeSpecifications(body.specifications)
  }
  if (body.deliverablePincodes != null) {
    out.deliverablePincodes = body.deliverablePincodes.map((x) => ({
      pincode: normalizePincode(x.pincode) || String(x.pincode).trim(),
      deliveryDays: x.deliveryDays,
    }))
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'deliveryCenterPincode') ||
    Object.prototype.hasOwnProperty.call(body, 'deliveryRadiusKm') ||
    Object.prototype.hasOwnProperty.call(body, 'radiusDeliveryDays')
  ) {
    const center = normalizePincode(body.deliveryCenterPincode)
    const r = body.deliveryRadiusKm == null ? NaN : Number(body.deliveryRadiusKm)
    if (center && Number.isFinite(r) && r > 0) {
      out.deliveryCenterPincode = center
      out.deliveryRadiusKm = Math.min(500, Math.max(1, r))
      const d =
        body.radiusDeliveryDays == null ? 3 : Math.floor(Number(body.radiusDeliveryDays) || 3)
      out.radiusDeliveryDays = Math.max(1, Math.min(90, d))
    } else {
      out.deliveryCenterPincode = null
      out.deliveryRadiusKm = null
      out.radiusDeliveryDays = null
    }
  }
  return out
}

productsRouter.post('/', requireAdminToken, async (req, res, next) => {
  try {
    const data = ProductUpsertBaseSchema.parse(req.body)
    assertVariantsOrSimpleCustomForCreate(data)
    const created = await Product.create(sanitizeProductPayload(data))
    res.status(201).json(created)
  } catch (e) {
    if (e?.statusCode === 400 && Array.isArray(e.issues)) {
      return res.status(400).json({ error: e.message, issues: e.issues })
    }
    next(e)
  }
})

productsRouter.put('/:id', requireAdminToken, async (req, res, next) => {
  try {
    const data = ProductUpsertBaseSchema.partial().parse(stripEmptyStringsFromPatchBody(req.body))
    if (data.variants !== undefined && data.variants.length < 1) {
      const scOk = simpleCustomPricingIsComplete(data.simpleCustomPricing)
      if (!scOk) {
        return res.status(400).json({
          error: 'At least one variant is required, or enable Simple custom pricing with rate and thickness options.',
        })
      }
    }
    const doc = await Product.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Product not found' })
    const payload = sanitizeProductPayload(data)
    doc.set(payload)
    if (payload.variants !== undefined) doc.markModified('variants')
    if (payload.simpleCustomPricing !== undefined) doc.markModified('simpleCustomPricing')
    await doc.save()
    const updated = await Product.findById(req.params.id).populate('category')
    res.json(updated)
  } catch (e) {
    next(e)
  }
})

productsRouter.delete('/:id', requireAdminToken, async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Product not found' })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
