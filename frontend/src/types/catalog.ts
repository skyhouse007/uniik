export type FirmnessOption = 'soft' | 'medium' | 'firm'

export type Category = {
  _id: string
  name: string
  image?: string
  parentId?: string | null
  /** Lower values appear first among siblings (same parent). */
  sortOrder?: number
}

export type ProductVariant = {
  /** Mattress type: Single, Double, Queen, King, Custom, etc. Omit or empty for legacy products. */
  variantCategory?: string
  /**
   * `custom_volume`: price = `pricePerCubicInch` × L×W×thickness (cu.in.).
   * `custom_area`: legacy ₹/sq.in × L × W.
   */
  pricingMode?: 'standard' | 'custom_area' | 'custom_volume'
  pricePerSqInch?: number
  pricePerCubicInch?: number
  /** If both > 0, cap resulting L×W×T volume; else bounds follow min/max L×W × thickness. */
  customMinVolumeCuIn?: number
  customMaxVolumeCuIn?: number
  customMinLengthIn?: number
  customMaxLengthIn?: number
  customMinWidthIn?: number
  customMaxWidthIn?: number
  size: string
  thickness: string
  price: number
  discountPercentage: number
  /** Set by API after save; may be missing on older documents — use `variantEffectiveFinal()` for display. */
  finalPrice?: number
  stock: number
  isPopular: boolean
}

export type ProductSpecification = {
  title: string
  value: string
}

export type DeliverablePincode = {
  pincode: string
  deliveryDays: number
}

/** One ₹/cu.in for any size; optional mattress type (default Custom). Can coexist with variant rows. */
export type SimpleCustomPricing = {
  enabled?: boolean
  /** Mattress type label that uses this product-level rate (default Custom). */
  variantCategory?: string
  pricePerCubicInch?: number
  discountPercentage?: number
  customMinLengthIn?: number
  customMaxLengthIn?: number
  customMinWidthIn?: number
  customMaxWidthIn?: number
  customMinVolumeCuIn?: number
  customMaxVolumeCuIn?: number
  thicknessOptions?: string[]
  stock?: number
}

export type Product = {
  _id: string
  productName: string
  modelName: string
  slug?: string
  category: Category | string
  shortDescription: string
  fullDescription: string
  images: string[]
  thumbnail?: string
  model3DUrl?: string
  simpleCustomPricing?: SimpleCustomPricing
  variants: ProductVariant[]
  specifications: ProductSpecification[]
  deliverablePincodes: DeliverablePincode[]
  /** When set with deliveryRadiusKm, delivery uses distance from this pin (km) instead of the list below. */
  deliveryCenterPincode?: string | null
  deliveryRadiusKm?: number | null
  radiusDeliveryDays?: number | null
  warrantyPeriod: string
  deliveryTimeline: string
  returnPolicy: string
  minFinalPrice?: number
  maxFinalPrice?: number
  brand: string
  rating: number
  firmness?: FirmnessOption
  popularity?: number
  promoBadgeType: 'best_seller' | 'extra_offer' | 'last_chance' | 'trial_100_nights' | 'custom'
  promoBadgeText: string
  createdAt?: string
  updatedAt?: string
}

export type Review = {
  _id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title?: string
  comment: string
  createdAt: string
}
