import mongoose from 'mongoose'
import crypto from 'crypto'
import { buildSimpleCustomVirtualVariant, computeFinalPrice, variantVolumeBounds } from '../utils/pricing.js'

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96)
}

const PincodeSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, trim: true },
    deliveryDays: { type: Number, required: true, min: 1, max: 90 },
  },
  { _id: false },
)

const VariantSchema = new mongoose.Schema(
  {
    /** Top-level type e.g. Single, Double, Queen, King, Custom (optional; empty = legacy flat variants). */
    variantCategory: { type: String, trim: true, default: '' },
    /**
     * standard = fixed `price`;
     * custom_volume = `pricePerCubicInch` × volume (cu.in.); cart size `v12345`;
     * custom_area = legacy ₹/sq.in × L × W.
     */
    pricingMode: {
      type: String,
      enum: ['standard', 'custom_area', 'custom_volume'],
      default: 'standard',
    },
    pricePerSqInch: { type: Number, min: 0, default: 0 },
    pricePerCubicInch: { type: Number, min: 0, default: 0 },
    /** When set (>0), customer enters total cu.in.; else bounds derived from L×W×T below. */
    customMinVolumeCuIn: { type: Number, min: 0, max: 10_000_000, default: 0 },
    customMaxVolumeCuIn: { type: Number, min: 0, max: 10_000_000, default: 0 },
    customMinLengthIn: { type: Number, min: 1, max: 240, default: 60 },
    customMaxLengthIn: { type: Number, min: 1, max: 240, default: 84 },
    customMinWidthIn: { type: Number, min: 1, max: 240, default: 24 },
    customMaxWidthIn: { type: Number, min: 1, max: 240, default: 78 },
    size: { type: String, required: true, trim: true },
    thickness: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    finalPrice: { type: Number, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0 },
    isPopular: { type: Boolean, default: false },
  },
  { _id: false },
)

const SpecSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
)

/** One rate for any L×W×T; optional mattress type label (default Custom). Can coexist with other variant rows. */
const SimpleCustomPricingSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    /** PDP / cart match this type to product-level simple custom (default Custom). */
    variantCategory: { type: String, trim: true, default: 'Custom' },
    pricePerCubicInch: { type: Number, min: 0, default: 0 },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    customMinLengthIn: { type: Number, min: 1, max: 240, default: 60 },
    customMaxLengthIn: { type: Number, min: 1, max: 240, default: 84 },
    customMinWidthIn: { type: Number, min: 1, max: 240, default: 24 },
    customMaxWidthIn: { type: Number, min: 1, max: 240, default: 78 },
    customMinVolumeCuIn: { type: Number, min: 0, max: 10_000_000, default: 0 },
    customMaxVolumeCuIn: { type: Number, min: 0, max: 10_000_000, default: 0 },
    thicknessOptions: { type: [String], default: ['6 inch', '8 inch'] },
    stock: { type: Number, min: 0, default: 999 },
  },
  { _id: false },
)

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, index: true },
    modelName: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    images: { type: [String], default: [] },
    thumbnail: { type: String, trim: true },
    model3DUrl: { type: String, trim: true },
    simpleCustomPricing: { type: SimpleCustomPricingSchema, default: undefined },
    variants: { type: [VariantSchema], default: [] },
    specifications: { type: [SpecSchema], default: [] },
    deliverablePincodes: { type: [PincodeSchema], default: [] },
    /** When set with deliveryRadiusKm, delivery is allowed for any pincode within that distance (km) of this pin. */
    deliveryCenterPincode: { type: String, trim: true },
    deliveryRadiusKm: { type: Number, min: 1, max: 500 },
    radiusDeliveryDays: { type: Number, min: 1, max: 90, default: 3 },
    warrantyPeriod: { type: String, required: true },
    deliveryTimeline: { type: String, required: true },
    returnPolicy: { type: String, required: true },
    minFinalPrice: { type: Number, default: 0, index: true },
    maxFinalPrice: { type: Number, default: 0 },
    brand: { type: String, required: true, index: true },
    rating: { type: Number, default: 4.2, min: 0, max: 5 },
    firmness: { type: String, enum: ['soft', 'medium', 'firm'], default: 'medium' },
    popularity: { type: Number, default: 0, index: true },
    promoBadgeType: {
      type: String,
      enum: ['best_seller', 'extra_offer', 'last_chance', 'trial_100_nights', 'custom'],
      required: true,
    },
    promoBadgeText: { type: String, required: true },
  },
  { timestamps: true },
)

ProductSchema.pre('validate', function () {
  const doc = this
  if (!doc.slug && doc.productName) {
    const base = slugify(doc.productName)
    doc.slug = `${base || 'product'}-${crypto.randomBytes(3).toString('hex')}`
  }
})

ProductSchema.pre('save', function () {
  const doc = this
  if (!doc.isModified('variants') && !doc.isModified('simpleCustomPricing') && !doc.isNew) return

  const sc = doc.simpleCustomPricing
  const scOn =
    sc?.enabled &&
    Number(sc.pricePerCubicInch) > 0 &&
    Array.isArray(sc.thicknessOptions) &&
    sc.thicknessOptions.length > 0

  let minP = Infinity
  let maxP = -1

  if (doc.variants?.length) {
    for (const v of doc.variants || []) {
      const d = v.discountPercentage || 0
      if (v.pricingMode === 'custom_volume' && (v.pricePerCubicInch || 0) > 0) {
        const { minV, maxV } = variantVolumeBounds(v)
        const minBase = v.pricePerCubicInch * minV
        const maxBase = v.pricePerCubicInch * maxV
        const minFp = Math.max(0, Math.round(minBase - (minBase * d) / 100))
        const maxFp = Math.max(0, Math.round(maxBase - (maxBase * d) / 100))
        v.finalPrice = minFp
        if (minFp < minP) minP = minFp
        if (maxFp > maxP) maxP = maxFp
      } else if (v.pricingMode === 'custom_area' && (v.pricePerSqInch || 0) > 0) {
        const minL = v.customMinLengthIn ?? 60
        const maxL = v.customMaxLengthIn ?? 84
        const minW = v.customMinWidthIn ?? 24
        const maxW = v.customMaxWidthIn ?? 78
        const minBase = v.pricePerSqInch * minL * minW
        const maxBase = v.pricePerSqInch * maxL * maxW
        const minFp = Math.max(0, Math.round(minBase - (minBase * d) / 100))
        const maxFp = Math.max(0, Math.round(maxBase - (maxBase * d) / 100))
        v.finalPrice = minFp
        if (minFp < minP) minP = minFp
        if (maxFp > maxP) maxP = maxFp
      } else {
        const fp = Math.max(0, Math.round(v.price - (v.price * d) / 100))
        v.finalPrice = fp
        if (fp < minP) minP = fp
        if (fp > maxP) maxP = fp
      }
    }
  }

  if (scOn) {
    const leanSc = sc && typeof sc.toObject === 'function' ? sc.toObject() : sc
    for (const th of sc.thicknessOptions) {
      const v = buildSimpleCustomVirtualVariant({ simpleCustomPricing: leanSc }, String(th).trim())
      if (!v) continue
      const d = v.discountPercentage || 0
      const ppcu = Number(v.pricePerCubicInch) || 0
      const { minV, maxV } = variantVolumeBounds(v)
      for (const vol of [minV, maxV]) {
        const base = ppcu * vol
        const fp = computeFinalPrice(base, d)
        if (fp < minP) minP = fp
        if (fp > maxP) maxP = fp
      }
    }
  }

  doc.minFinalPrice = minP === Infinity ? 0 : minP
  doc.maxFinalPrice = maxP < 0 ? 0 : maxP
})

ProductSchema.index({ productName: 'text', fullDescription: 'text', brand: 'text' })

export const Product = mongoose.model('Product', ProductSchema)
