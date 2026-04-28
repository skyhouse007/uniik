import { Fragment, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { adminDelete, adminGet, adminPost, adminPut } from '../../api/adminClient'
import { adminHeaders } from '../../api/adminClient'
import { computeVariantFinalPrice, parseThicknessInches } from '../../utils/product'

type Category = { _id: string; name: string }

type VariantRow = {
  size: string
  thickness: string
  price: string
  discountPercentage: string
  stock: string
  isPopular: boolean
  /** Priced as ₹/cu.in × customer volume; catalog `size` is `custom`. */
  customVolumePricing: boolean
  /** Loaded from API `custom_area` — keep ₹/sq.in on save (admin shows equivalent ₹/cu.in for editing). */
  legacyAreaPricing: boolean
  pricePerCubicInch: string
  customMinVolumeCuIn: string
  customMaxVolumeCuIn: string
  customMinLengthIn: string
  customMaxLengthIn: string
  customMinWidthIn: string
  customMaxWidthIn: string
}

function adminRowMinVolumeCuIn(row: VariantRow): number {
  const minV = Math.floor(Number(row.customMinVolumeCuIn) || 0)
  const maxV = Math.floor(Number(row.customMaxVolumeCuIn) || 0)
  if (minV > 0 && maxV > 0) return Math.min(minV, maxV)
  const t = parseThicknessInches(row.thickness)
  return Math.round((Number(row.customMinLengthIn) || 60) * (Number(row.customMinWidthIn) || 24) * t)
}

type SimpleCustomForm = {
  enabled: boolean
  pricePerCubicInch: string
  discountPercentage: string
  customMinLengthIn: string
  customMaxLengthIn: string
  customMinWidthIn: string
  customMaxWidthIn: string
  customMinVolumeCuIn: string
  customMaxVolumeCuIn: string
  thicknessOptions: string
  stock: string
}

function emptySimpleCustomForm(): SimpleCustomForm {
  return {
    enabled: false,
    pricePerCubicInch: '',
    discountPercentage: '0',
    customMinLengthIn: '60',
    customMaxLengthIn: '84',
    customMinWidthIn: '24',
    customMaxWidthIn: '78',
    customMinVolumeCuIn: '0',
    customMaxVolumeCuIn: '0',
    thicknessOptions: '6 inch, 8 inch',
    stock: '999',
  }
}

function newVariantGroupId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

type VariantGroupForm = { id: string; category: string; subRows: VariantRow[] }

function emptyVariantRow(): VariantRow {
  return {
    size: '',
    thickness: '',
    price: '',
    discountPercentage: '0',
    stock: '10',
    isPopular: false,
    customVolumePricing: false,
    legacyAreaPricing: false,
    pricePerCubicInch: '',
    customMinVolumeCuIn: '0',
    customMaxVolumeCuIn: '0',
    customMinLengthIn: '60',
    customMaxLengthIn: '84',
    customMinWidthIn: '24',
    customMaxWidthIn: '78',
  }
}

/** Group API variants by `variantCategory` for admin editing. */
function productVariantsToFormGroups(raw: unknown): VariantGroupForm[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ id: newVariantGroupId(), category: 'Single', subRows: [emptyVariantRow()] }]
  }
  const order: string[] = []
  const map = new Map<string, VariantRow[]>()
  for (const v of raw as any[]) {
    const cat = String(v?.variantCategory ?? '').trim()
    if (!map.has(cat)) {
      map.set(cat, [])
      order.push(cat)
    }
    const vol = v?.pricingMode === 'custom_volume' && Number(v?.pricePerCubicInch) > 0
    const legacyArea = v?.pricingMode === 'custom_area' && Number(v?.pricePerSqInch) > 0
    const customPriced = vol || legacyArea
    let pricePerCubicInch = String(v?.pricePerCubicInch ?? '')
    if (legacyArea && !vol) {
      const t = parseThicknessInches(String(v?.thickness ?? ''))
      pricePerCubicInch = String((Number(v?.pricePerSqInch) || 0) / t)
    }
    map.get(cat)!.push({
      size: customPriced ? 'custom' : String(v?.size ?? ''),
      thickness: String(v?.thickness ?? ''),
      price: String(v?.price ?? ''),
      discountPercentage: String(v?.discountPercentage ?? 0),
      stock: String(v?.stock ?? 0),
      isPopular: !!v?.isPopular,
      customVolumePricing: customPriced,
      legacyAreaPricing: legacyArea && !vol,
      pricePerCubicInch,
      customMinVolumeCuIn: String(v?.customMinVolumeCuIn ?? 0),
      customMaxVolumeCuIn: String(v?.customMaxVolumeCuIn ?? 0),
      customMinLengthIn: String(v?.customMinLengthIn ?? 60),
      customMaxLengthIn: String(v?.customMaxLengthIn ?? 84),
      customMinWidthIn: String(v?.customMinWidthIn ?? 24),
      customMaxWidthIn: String(v?.customMaxWidthIn ?? 78),
    })
  }
  return order.map((cat) => ({ id: newVariantGroupId(), category: cat, subRows: map.get(cat)! }))
}

type SpecRow = { title: string; value: string }
type PinRow = { pincode: string; deliveryDays: string }

function parseImageList(raw: string) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinImageList(list: string[]) {
  return list.map((s) => s.trim()).filter(Boolean).join(',')
}

function isValidUrl(u: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(u)
    return true
  } catch {
    return false
  }
}

/** API / legacy docs may store images as string or non-array — avoid .join/.map crashes in Edit. */
function productImagesAsList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((u) => String(u).trim()).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) return parseImageList(raw)
  return []
}

function productSpecsForForm(raw: unknown): SpecRow[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((s: any) => ({ title: String(s?.title ?? ''), value: String(s?.value ?? '') }))
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>)
    if (entries.length) {
      return entries.map(([title, value]) => ({ title, value: String(value ?? '') }))
    }
  }
  return [{ title: '', value: '' }]
}

function productPincodesForForm(raw: unknown): PinRow[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ pincode: '', deliveryDays: '3' }]
  }
  return raw.map((x: any) => ({
    pincode: String(x?.pincode ?? ''),
    deliveryDays: String(x?.deliveryDays ?? 3),
  }))
}

function categoryIdFromProduct(p: { category?: unknown }): string {
  const c = p?.category as { _id?: unknown } | string | null | undefined
  if (c && typeof c === 'object' && c._id != null) return String(c._id)
  if (typeof c === 'string') return c
  return ''
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

export function AdminProductsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<any[] | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imagesList, setImagesList] = useState<string[]>([])

  const [variantGroups, setVariantGroups] = useState<VariantGroupForm[]>([
    {
      id: newVariantGroupId(),
      category: 'Single',
      subRows: [
        {
          size: '72x36',
          thickness: '6 inch',
          price: '18999',
          discountPercentage: '20',
          stock: '10',
          isPopular: false,
          customVolumePricing: false,
          legacyAreaPricing: false,
          pricePerCubicInch: '',
          customMinVolumeCuIn: '0',
          customMaxVolumeCuIn: '0',
          customMinLengthIn: '60',
          customMaxLengthIn: '84',
          customMinWidthIn: '24',
          customMaxWidthIn: '78',
        },
      ],
    },
  ])
  const [specRows, setSpecRows] = useState<SpecRow[]>([{ title: 'Material', value: 'Memory foam' }])
  const [pinRows, setPinRows] = useState<PinRow[]>([{ pincode: '560001', deliveryDays: '3' }])
  const [deliveryCenterPincode, setDeliveryCenterPincode] = useState('')
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState('')
  const [radiusDeliveryDays, setRadiusDeliveryDays] = useState('3')
  const [simpleCustomForm, setSimpleCustomForm] = useState<SimpleCustomForm>(() => emptySimpleCustomForm())

  const [form, setForm] = useState({
    productName: '',
    slug: '',
    modelName: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    images: '',
    thumbnail: '',
    model3DUrl: '',
    brand: 'CozyFoam',
    rating: 4.4,
    firmness: 'medium',
    popularity: 0,
    warrantyPeriod: '10 Years',
    deliveryTimeline: '3–5 business days',
    returnPolicy: '100-night trial where applicable.',
    promoBadgeType: 'best_seller',
    promoBadgeText: 'Best Seller',
  })

  async function load() {
    setError('')
    setSuccess('')
    const [cats, prods] = await Promise.all([
      adminGet<{ items: Category[] }>('/categories'),
      adminGet<{ items: any[] }>('/products', { page: 1, limit: 50, sort: 'newest' }),
    ])
    setCategories(cats.items)
    setItems(prods.items)
    if (!form.category && cats.items[0]?._id) setForm((f) => ({ ...f, category: cats.items[0]._id }))
  }

  useEffect(() => {
    load().catch((e: any) => setError(e?.response?.data?.error ?? 'Failed to load'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setImagesList(parseImageList(form.images))
  }, [form.images])

  const canSubmit = useMemo(() => {
    const rowValid = (r: VariantRow) => {
      if (!r.thickness.trim()) return false
      if (r.customVolumePricing) {
        const ppcu = Number(r.pricePerCubicInch)
        return Number.isFinite(ppcu) && ppcu > 0
      }
      return r.size.trim() && !Number.isNaN(Number(r.price)) && Number(r.price) >= 0
    }
    const variantsOk = variantGroups.some((g) => g.subRows.some(rowValid))
    const thicknessOpts = simpleCustomForm.thicknessOptions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const simpleOk =
      simpleCustomForm.enabled &&
      Number(simpleCustomForm.pricePerCubicInch) > 0 &&
      thicknessOpts.length > 0
    const pricingOk = simpleOk || variantsOk
    return (
      form.productName.trim().length >= 2 &&
      form.modelName.trim().length >= 1 &&
      form.shortDescription.trim().length >= 5 &&
      form.fullDescription.trim().length >= 10 &&
      !!form.category &&
      pricingOk
    )
  }, [form, variantGroups, simpleCustomForm])

  function buildPayload() {
    const variants = variantGroups.flatMap((g) =>
      g.subRows
        .map((r) => {
          const customPriced = r.customVolumePricing && Number(r.pricePerCubicInch) > 0
          const legacyArea = customPriced && r.legacyAreaPricing
          const customVol = customPriced && !legacyArea
          const mnV = Math.floor(Number(r.customMinVolumeCuIn) || 0)
          const mxV = Math.floor(Number(r.customMaxVolumeCuIn) || 0)
          const minL = Math.floor(Number(r.customMinLengthIn) || 60)
          const maxL = Math.floor(Number(r.customMaxLengthIn) || 84)
          const minW = Math.floor(Number(r.customMinWidthIn) || 24)
          const maxW = Math.floor(Number(r.customMaxWidthIn) || 78)
          if (legacyArea) {
            const t = parseThicknessInches(r.thickness)
            const ppsi = Math.max(0, (Number(r.pricePerCubicInch) || 0) * t)
            return {
              variantCategory: g.category.trim(),
              pricingMode: 'custom_area' as const,
              pricePerSqInch: ppsi,
              pricePerCubicInch: 0,
              customMinVolumeCuIn: 0,
              customMaxVolumeCuIn: 0,
              customMinLengthIn: minL,
              customMaxLengthIn: maxL,
              customMinWidthIn: minW,
              customMaxWidthIn: maxW,
              size: 'custom',
              thickness: r.thickness.trim(),
              price: 0,
              discountPercentage: Math.min(100, Math.max(0, Number(r.discountPercentage) || 0)),
              stock: Math.max(0, Math.floor(Number(r.stock) || 0)),
              isPopular: r.isPopular,
            }
          }
          if (customVol) {
            return {
              variantCategory: g.category.trim(),
              pricingMode: 'custom_volume' as const,
              pricePerCubicInch: Math.max(0, Number(r.pricePerCubicInch) || 0),
              pricePerSqInch: 0,
              customMinVolumeCuIn: mnV,
              customMaxVolumeCuIn: mxV,
              customMinLengthIn: minL,
              customMaxLengthIn: maxL,
              customMinWidthIn: minW,
              customMaxWidthIn: maxW,
              size: 'custom',
              thickness: r.thickness.trim(),
              price: 0,
              discountPercentage: Math.min(100, Math.max(0, Number(r.discountPercentage) || 0)),
              stock: Math.max(0, Math.floor(Number(r.stock) || 0)),
              isPopular: r.isPopular,
            }
          }
          return {
            variantCategory: g.category.trim(),
            pricingMode: 'standard' as const,
            pricePerCubicInch: 0,
            pricePerSqInch: 0,
            size: r.size.trim(),
            thickness: r.thickness.trim(),
            price: Math.max(0, Number(r.price) || 0),
            discountPercentage: Math.min(100, Math.max(0, Number(r.discountPercentage) || 0)),
            stock: Math.max(0, Math.floor(Number(r.stock) || 0)),
            isPopular: r.isPopular,
          }
        })
        .filter((v) => {
          if (!v.thickness) return false
          if (v.pricingMode === 'standard') return !!v.size
          if (v.pricingMode === 'custom_area') return (v.pricePerSqInch ?? 0) > 0
          return (v.pricePerCubicInch ?? 0) > 0
        }),
    )

    const specifications = specRows
      .map((r) => ({ title: r.title.trim(), value: r.value.trim() }))
      .filter((r) => r.title && r.value)

    const deliverablePincodes = pinRows
      .map((r) => ({
        pincode: r.pincode.replace(/\D/g, '') || r.pincode.trim(),
        deliveryDays: Math.max(1, Math.min(90, Math.floor(Number(r.deliveryDays) || 3))),
      }))
      .filter((r) => r.pincode.length >= 3)

    const center = deliveryCenterPincode.replace(/\D/g, '')
    const radiusNum = Number(String(deliveryRadiusKm).trim())
    const useRadius = center.length === 6 && Number.isFinite(radiusNum) && radiusNum > 0

    const images = parseImageList(form.images)
    const invalidImages = images.filter((u) => !isValidUrl(u))
    const cleanedImages = images.filter((u) => isValidUrl(u))
    const thumbnail = form.thumbnail.trim()
    const thumbnailOk = !thumbnail || isValidUrl(thumbnail)
    const model3DUrl = form.model3DUrl.trim()
    const model3DOk = !model3DUrl || isValidUrl(model3DUrl)

    if (invalidImages.length) {
      throw new Error(`Images must be full URLs (https://...). Invalid: ${invalidImages[0]}`)
    }
    if (!thumbnailOk) {
      throw new Error('Thumbnail must be a full URL (https://...)')
    }
    if (!model3DOk) {
      throw new Error('3D model URL must be a full URL (https://...)')
    }

    const thicknessOptions = simpleCustomForm.thicknessOptions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    let simpleCustomPricing: Record<string, unknown>
    if (simpleCustomForm.enabled) {
      const ppcu = Number(simpleCustomForm.pricePerCubicInch)
      if (!Number.isFinite(ppcu) || ppcu <= 0) {
        throw new Error('Simple custom: enter ₹ per cu.in (rate)')
      }
      if (!thicknessOptions.length) {
        throw new Error(
          'Simple custom: add at least one thickness label (comma-separated), e.g. 6 inch, 8 inch',
        )
      }
      simpleCustomPricing = {
        enabled: true,
        variantCategory: 'Custom',
        pricePerCubicInch: ppcu,
        discountPercentage: Math.min(100, Math.max(0, Number(simpleCustomForm.discountPercentage) || 0)),
        customMinLengthIn: Math.floor(Number(simpleCustomForm.customMinLengthIn) || 60),
        customMaxLengthIn: Math.floor(Number(simpleCustomForm.customMaxLengthIn) || 84),
        customMinWidthIn: Math.floor(Number(simpleCustomForm.customMinWidthIn) || 24),
        customMaxWidthIn: Math.floor(Number(simpleCustomForm.customMaxWidthIn) || 78),
        customMinVolumeCuIn: Math.floor(Number(simpleCustomForm.customMinVolumeCuIn) || 0),
        customMaxVolumeCuIn: Math.floor(Number(simpleCustomForm.customMaxVolumeCuIn) || 0),
        thicknessOptions,
        stock: Math.max(0, Math.floor(Number(simpleCustomForm.stock) || 999)),
      }
    } else {
      simpleCustomPricing = {
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

    return {
      productName: form.productName.trim(),
      slug: form.slug.trim() || undefined,
      modelName: form.modelName.trim(),
      category: form.category,
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      images: cleanedImages,
      thumbnail: thumbnail || undefined,
      model3DUrl: model3DUrl || undefined,
      variants,
      specifications,
      deliverablePincodes,
      deliveryCenterPincode: useRadius ? center : null,
      deliveryRadiusKm: useRadius ? Math.min(500, Math.max(1, radiusNum)) : null,
      radiusDeliveryDays: useRadius
        ? Math.max(1, Math.min(90, Math.floor(Number(radiusDeliveryDays) || 3)))
        : null,
      warrantyPeriod: form.warrantyPeriod.trim(),
      deliveryTimeline: form.deliveryTimeline.trim(),
      returnPolicy: form.returnPolicy.trim(),
      brand: form.brand.trim(),
      rating: Number(form.rating) || undefined,
      firmness: form.firmness as 'soft' | 'medium' | 'firm',
      popularity: Number(form.popularity) || 0,
      promoBadgeType: form.promoBadgeType as any,
      promoBadgeText: form.promoBadgeText.trim(),
      simpleCustomPricing,
    }
  }

  async function submit() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = buildPayload()
      if (editingId) await adminPut(`/products/${editingId}`, payload)
      else await adminPost('/products', payload)
      setSuccess(editingId ? 'Product updated.' : 'Product created.')
      resetForm()
      await load()
    } catch (e: any) {
      const issues = e?.response?.data?.issues
      const firstIssue = Array.isArray(issues) && issues[0] ? issues[0] : null
      const firstIssueMsg =
        firstIssue && typeof firstIssue === 'object'
          ? `${(firstIssue.path ?? []).join('.') || 'body'}: ${firstIssue.message ?? 'Invalid'}`
          : ''
      setError(firstIssueMsg || e?.response?.data?.error || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm((f) => ({
      ...f,
      productName: '',
      slug: '',
      modelName: '',
      shortDescription: '',
      fullDescription: '',
      images: '',
      thumbnail: '',
    }))
    setVariantGroups([{ id: newVariantGroupId(), category: 'Single', subRows: [emptyVariantRow()] }])
    setSimpleCustomForm(emptySimpleCustomForm())
    setSpecRows([{ title: '', value: '' }])
    setPinRows([{ pincode: '', deliveryDays: '3' }])
    setDeliveryCenterPincode('')
    setDeliveryRadiusKm('')
    setRadiusDeliveryDays('3')
  }

  function applyProductToForm(p: any) {
    const cat = categoryIdFromProduct(p)
    setForm({
      productName: p.productName ?? '',
      slug: p.slug ?? '',
      modelName: p.modelName ?? '',
      shortDescription: p.shortDescription ?? '',
      fullDescription: p.fullDescription ?? '',
      category: cat || categories[0]?._id || '',
      images: productImagesAsList(p.images).join(', '),
      thumbnail: p.thumbnail ?? '',
      model3DUrl: p.model3DUrl ?? '',
      brand: p.brand ?? 'CozyFoam',
      rating: p.rating ?? 4.5,
      firmness: p.firmness ?? 'medium',
      popularity: p.popularity ?? 0,
      warrantyPeriod: p.warrantyPeriod ?? '',
      deliveryTimeline: p.deliveryTimeline ?? '',
      returnPolicy: p.returnPolicy ?? '',
      promoBadgeType: p.promoBadgeType ?? 'custom',
      promoBadgeText: p.promoBadgeText ?? '',
    })
    const sc = p.simpleCustomPricing
    const scLive =
      sc?.enabled && Number(sc.pricePerCubicInch) > 0 && (sc.thicknessOptions?.length ?? 0) > 0
    if (scLive) {
      setSimpleCustomForm({
        enabled: true,
        pricePerCubicInch: String(sc.pricePerCubicInch),
        discountPercentage: String(sc.discountPercentage ?? 0),
        customMinLengthIn: String(sc.customMinLengthIn ?? 60),
        customMaxLengthIn: String(sc.customMaxLengthIn ?? 84),
        customMinWidthIn: String(sc.customMinWidthIn ?? 24),
        customMaxWidthIn: String(sc.customMaxWidthIn ?? 78),
        customMinVolumeCuIn: String(sc.customMinVolumeCuIn ?? 0),
        customMaxVolumeCuIn: String(sc.customMaxVolumeCuIn ?? 0),
        thicknessOptions: (sc.thicknessOptions ?? []).join(', '),
        stock: String(sc.stock ?? 999),
      })
      setVariantGroups(productVariantsToFormGroups(p.variants))
    } else {
      setSimpleCustomForm(emptySimpleCustomForm())
      setVariantGroups(productVariantsToFormGroups(p.variants))
    }
    setSpecRows(productSpecsForForm(p.specifications))
    setPinRows(productPincodesForForm(p.deliverablePincodes))
    setDeliveryCenterPincode(p.deliveryCenterPincode ? String(p.deliveryCenterPincode) : '')
    setDeliveryRadiusKm(p.deliveryRadiusKm != null && p.deliveryRadiusKm !== '' ? String(p.deliveryRadiusKm) : '')
    setRadiusDeliveryDays(String(p.radiusDeliveryDays ?? 3))
  }

  async function startEdit(p: any) {
    setError('')
    const id = p?._id != null ? String(p._id) : ''
    if (!id) {
      setError('Cannot edit this product (missing id). Refresh the list and try again.')
      return
    }
    setEditingId(id)
    try {
      const full = await adminGet<any>(`/products/${id}`)
      /** 304 + empty `data` would wipe variants / mattress type — use list row if payload is missing. */
      const ok = full && typeof full === 'object' && (full._id != null || full.productName != null)
      applyProductToForm(ok ? full : p)
    } catch {
      applyProductToForm(p)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeImageAt(index: number) {
    setForm((f) => {
      const list = parseImageList(f.images)
      const removed = list[index]
      if (!removed) return f
      const next = list.filter((_, i) => i !== index)
      const thumb = f.thumbnail.trim()
      const removedTrim = removed.trim()
      const clearThumb = thumb === removedTrim
      return {
        ...f,
        images: joinImageList(next),
        thumbnail: clearThumb ? '' : f.thumbnail,
      }
    })
  }

  async function uploadImages(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const folder = editingId ? `cozyfoam/products/${editingId}` : 'cozyfoam/products/tmp'
      const sigRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}/admin/uploads/signature?folder=${encodeURIComponent(folder)}`,
        { headers: adminHeaders() as any },
      )
      if (!sigRes.ok) throw new Error('Failed to get upload signature')
      const sig = await sigRes.json()
      const uploadedUrls: string[] = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', sig.apiKey)
        formData.append('timestamp', String(sig.timestamp))
        formData.append('folder', sig.folder)
        formData.append('signature', sig.signature)
        const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        })
        const json = await up.json()
        if (!up.ok) throw new Error(json?.error?.message ?? 'Upload failed')
        uploadedUrls.push(json.secure_url)
      }
      setForm((f) => {
        const existing = parseImageList(f.images)
        return { ...f, images: joinImageList([...existing, ...uploadedUrls]) }
      })
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function uploadModel(file: File | null) {
    if (!file) return
    if (!editingId) {
      setError('Save the product first, then upload the 3D model.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const folder = `cozyfoam/products/${editingId}`
      const sigRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}/admin/uploads/signature?folder=${encodeURIComponent(folder)}&resourceType=raw`,
        { headers: adminHeaders() as any },
      )
      if (!sigRes.ok) throw new Error('Failed to get upload signature')
      const sig = await sigRes.json()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sig.apiKey)
      formData.append('timestamp', String(sig.timestamp))
      formData.append('folder', sig.folder)
      formData.append('signature', sig.signature)
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`, {
        method: 'POST',
        body: formData,
      })
      const json = await up.json()
      if (!up.ok) throw new Error(json?.error?.message ?? 'Model upload failed')
      setForm((f) => ({ ...f, model3DUrl: json.secure_url as string }))
    } catch (e: any) {
      setError(e?.message ?? 'Model upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Products — CozyFoam</title>
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[rgb(var(--fg))]">Products</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Structured catalog: variants, specs, delivery pincodes</p>
        </div>
        <button
          type="button"
          onClick={() => load().catch(() => setError('Failed to refresh'))}
          className="rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-2 text-xs font-semibold"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,520px)_1fr]">
        <div className="space-y-4">
          <Section title="1. Basic information">
            <input
              value={form.productName}
              onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
              placeholder="Product name"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <input
              value={form.modelName}
              onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
              placeholder="Model name (short)"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Slug (optional — auto if empty)"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <textarea
              value={form.shortDescription}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              placeholder="Short description"
              rows={2}
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <textarea
              value={form.fullDescription}
              onChange={(e) => setForm((f) => ({ ...f, fullDescription: e.target.value }))}
              placeholder="Full description"
              rows={5}
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Brand"
                className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
              />
              <select
                value={form.firmness}
                onChange={(e) => setForm((f) => ({ ...f, firmness: e.target.value }))}
                className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
              >
                <option value="soft">Soft</option>
                <option value="medium">Medium</option>
                <option value="firm">Firm</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={String(form.rating)}
                onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                placeholder="Rating"
                className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
              />
              <input
                value={String(form.popularity)}
                onChange={(e) => setForm((f) => ({ ...f, popularity: Number(e.target.value) }))}
                placeholder="Popularity"
                className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
              />
            </div>
          </Section>

          <Section title="2. Product media">
            <input
              value={form.images}
              onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
              placeholder="Image URLs (comma separated)"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-semibold">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImages(e.target.files)} />
              {uploading ? 'Uploading…' : 'Upload to Cloudinary'}
            </label>
            <input
              value={form.thumbnail}
              onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
              placeholder="Thumbnail URL (optional)"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <input
              value={form.model3DUrl}
              onChange={(e) => setForm((f) => ({ ...f, model3DUrl: e.target.value }))}
              placeholder="3D model URL"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-semibold">
              <input type="file" accept=".glb,model/gltf-binary" className="hidden" onChange={(e) => uploadModel(e.target.files?.[0] ?? null)} />
              Upload .glb
            </label>
            {imagesList.length ? (
              <div className="grid grid-cols-3 gap-2">
                {imagesList.map((url, idx) => (
                  <div
                    key={url + idx}
                    className="relative overflow-hidden rounded-lg border border-[rgb(var(--border))]"
                  >
                    <img src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="absolute right-1 top-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm hover:bg-red-600"
                      title="Remove from product"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Section>

          <Section title="5. Warranty & delivery">
            <input
              value={form.warrantyPeriod}
              onChange={(e) => setForm((f) => ({ ...f, warrantyPeriod: e.target.value }))}
              placeholder="Warranty (e.g. 10 Years)"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <input
              value={form.deliveryTimeline}
              onChange={(e) => setForm((f) => ({ ...f, deliveryTimeline: e.target.value }))}
              placeholder="Delivery timeline"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <textarea
              value={form.returnPolicy}
              onChange={(e) => setForm((f) => ({ ...f, returnPolicy: e.target.value }))}
              placeholder="Return policy"
              rows={2}
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.promoBadgeType}
                onChange={(e) => setForm((f) => ({ ...f, promoBadgeType: e.target.value }))}
                className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
              >
                <option value="best_seller">Best seller</option>
                <option value="extra_offer">Extra offer</option>
                <option value="last_chance">Last chance</option>
                <option value="trial_100_nights">100 nights</option>
                <option value="custom">Custom</option>
              </select>
              <input
                value={form.promoBadgeText}
                onChange={(e) => setForm((f) => ({ ...f, promoBadgeText: e.target.value }))}
                placeholder="Badge text"
                className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
              />
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="3. Variant pricing">
            <div className="rounded-xl border border-[rgb(var(--brand))] bg-[rgb(var(--surface))] p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={simpleCustomForm.enabled}
                  onChange={(e) => {
                    const on = e.target.checked
                    setSimpleCustomForm((f) => ({ ...f, enabled: on }))
                  }}
                  className="mt-1 h-4 w-4 accent-[rgb(var(--brand))]"
                />
                <div>
                  <div className="text-sm font-semibold text-[rgb(var(--fg))]">Show “Custom” on the store</div>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Adds a <strong>Custom</strong> type next to Single, Double, Queen, King so buyers can order any length ×
                    width (₹ per cu.in × L × W × T). Use the table below for fixed sizes; use this when you do not want to
                    add a separate <strong>Custom</strong> type group with the Custom column ticked.
                  </p>
                </div>
              </label>
              {simpleCustomForm.enabled ? (
                <div className="mt-4 grid gap-3 border-t border-[rgb(var(--border))] pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-[rgb(var(--muted))]">₹ per cu.in (rate)</div>
                    <input
                      value={simpleCustomForm.pricePerCubicInch}
                      onChange={(e) => setSimpleCustomForm((f) => ({ ...f, pricePerCubicInch: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                      placeholder="e.g. 12"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-[rgb(var(--muted))]">Discount %</div>
                    <input
                      value={simpleCustomForm.discountPercentage}
                      onChange={(e) => setSimpleCustomForm((f) => ({ ...f, discountPercentage: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-semibold uppercase text-[rgb(var(--muted))]">
                      Thickness options (comma-separated)
                    </div>
                    <input
                      value={simpleCustomForm.thicknessOptions}
                      onChange={(e) => setSimpleCustomForm((f) => ({ ...f, thicknessOptions: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                      placeholder="6 inch, 8 inch, 10 inch"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-[rgb(var(--muted))]">L min / max (in)</div>
                    <div className="mt-1 flex gap-2">
                      <input
                        value={simpleCustomForm.customMinLengthIn}
                        onChange={(e) => setSimpleCustomForm((f) => ({ ...f, customMinLengthIn: e.target.value }))}
                        className="w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                      />
                      <input
                        value={simpleCustomForm.customMaxLengthIn}
                        onChange={(e) => setSimpleCustomForm((f) => ({ ...f, customMaxLengthIn: e.target.value }))}
                        className="w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-[rgb(var(--muted))]">W min / max (in)</div>
                    <div className="mt-1 flex gap-2">
                      <input
                        value={simpleCustomForm.customMinWidthIn}
                        onChange={(e) => setSimpleCustomForm((f) => ({ ...f, customMinWidthIn: e.target.value }))}
                        className="w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                      />
                      <input
                        value={simpleCustomForm.customMaxWidthIn}
                        onChange={(e) => setSimpleCustomForm((f) => ({ ...f, customMaxWidthIn: e.target.value }))}
                        className="w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-[rgb(var(--muted))]">Stock</div>
                    <input
                      value={simpleCustomForm.stock}
                      onChange={(e) => setSimpleCustomForm((f) => ({ ...f, stock: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-2 py-2"
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <p className="mt-4 text-xs text-[rgb(var(--muted))]">
              <span className="font-semibold">Column 1 — Mattress type:</span> one group per type (presets: Single, Double,
              Queen, King, Custom).{' '}
              <span className="font-semibold">Column 2 — Custom:</span> tick for that row to price by{' '}
              <strong>₹ per cu.in</strong> × customer size (length × width × thickness). Or use the checkbox above to add a
              store <strong>Custom</strong> type without extra rows. Fixed sizes: leave Custom off and use e.g. 72×48.
            </p>
            <div className="space-y-6">
              {variantGroups.map((group, gi) => (
                <div
                  key={group.id}
                  className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-[rgb(var(--border))] bg-white px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      Mattress type
                    </span>
                    <input
                      value={group.category}
                      onChange={(e) =>
                        setVariantGroups((groups) =>
                          groups.map((g, i) => (i === gi ? { ...g, category: e.target.value } : g)),
                        )
                      }
                      placeholder="e.g. Single, Double, Queen, King, Custom"
                      className="min-w-[12rem] flex-1 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={variantGroups.length <= 1}
                      onClick={() =>
                        setVariantGroups((groups) => (groups.length <= 1 ? groups : groups.filter((_, i) => i !== gi)))
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 disabled:opacity-40"
                    >
                      Remove type
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      Type presets
                    </span>
                    {(['Single', 'Double', 'Queen', 'King', 'Custom'] as const).map((label) => {
                      const active = group.category.trim() === label
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setVariantGroups((groups) =>
                              groups.map((g, i) => (i === gi ? { ...g, category: label } : g)),
                            )
                          }
                          className={[
                            'rounded-full border px-3 py-1 text-xs font-semibold transition',
                            active
                              ? 'border-[rgb(var(--brand))] bg-white text-[rgb(var(--brand))]'
                              : 'border-[rgb(var(--border))] bg-white text-[rgb(var(--fg))] hover:border-[rgb(var(--muted))]',
                          ].join(' ')}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-xs">
                      <thead className="border-b border-[rgb(var(--border))] text-[rgb(var(--muted))]">
                        <tr>
                          <th
                            className="w-16 min-w-[4rem] px-2 py-2 text-center text-[10px] font-bold uppercase leading-tight text-[rgb(var(--fg))]"
                            title="Custom: ₹ per cu.in × length × width × thickness"
                          >
                            Custom
                          </th>
                          <th className="px-2 py-2 font-semibold">Size</th>
                          <th className="px-2 py-2 font-semibold">Thickness</th>
                          <th className="px-2 py-2 font-semibold">Price ₹</th>
                          <th className="px-2 py-2 font-semibold">Disc %</th>
                          <th className="px-2 py-2 font-semibold">Final</th>
                          <th className="px-2 py-2 font-semibold">Stock</th>
                          <th className="px-2 py-2 font-semibold">Popular</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.subRows.map((row, ri) => {
                          const d = Number(row.discountPercentage) || 0
                          const t = parseThicknessInches(row.thickness)
                          const fp = row.customVolumePricing
                            ? row.legacyAreaPricing
                              ? computeVariantFinalPrice(
                                  (Number(row.pricePerCubicInch) || 0) *
                                    t *
                                    (Number(row.customMinLengthIn) || 60) *
                                    (Number(row.customMinWidthIn) || 24),
                                  d,
                                )
                              : computeVariantFinalPrice(
                                  (Number(row.pricePerCubicInch) || 0) * adminRowMinVolumeCuIn(row),
                                  d,
                                )
                            : computeVariantFinalPrice(Number(row.price) || 0, d)
                          return (
                            <Fragment key={ri}>
                              <tr className="border-b border-[rgb(var(--border))]">
                                <td className="p-1 text-center align-middle">
                                  <input
                                    type="checkbox"
                                    checked={row.customVolumePricing}
                                    title="Custom: ₹ per cu.in × customer volume (cu.in.)"
                                    className="h-4 w-4 accent-[rgb(var(--brand))]"
                                    onChange={(e) => {
                                      const checked = e.target.checked
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) =>
                                          i === gi
                                            ? {
                                                ...g,
                                                subRows: g.subRows.map((r, j) =>
                                                  j === ri
                                                    ? {
                                                        ...r,
                                                        customVolumePricing: checked,
                                                        legacyAreaPricing: checked ? false : r.legacyAreaPricing,
                                                        size: checked ? 'custom' : r.size === 'custom' ? '' : r.size,
                                                      }
                                                    : r,
                                                ),
                                              }
                                            : g,
                                        ),
                                      )
                                    }}
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    value={row.customVolumePricing ? 'custom' : row.size}
                                    readOnly={row.customVolumePricing}
                                    onChange={(e) =>
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) =>
                                          i === gi
                                            ? {
                                                ...g,
                                                subRows: g.subRows.map((r, j) =>
                                                  j === ri ? { ...r, size: e.target.value } : r,
                                                ),
                                              }
                                            : g,
                                        ),
                                      )
                                    }
                                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-sm read-only:bg-[rgb(var(--surface))]"
                                    placeholder="72x48"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    value={row.thickness}
                                    onChange={(e) =>
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) =>
                                          i === gi
                                            ? {
                                                ...g,
                                                subRows: g.subRows.map((r, j) =>
                                                  j === ri ? { ...r, thickness: e.target.value } : r,
                                                ),
                                              }
                                            : g,
                                        ),
                                      )
                                    }
                                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-sm"
                                    placeholder="6 inch"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    value={row.customVolumePricing ? '' : row.price}
                                    readOnly={row.customVolumePricing}
                                    onChange={(e) =>
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) =>
                                          i === gi
                                            ? {
                                                ...g,
                                                subRows: g.subRows.map((r, j) =>
                                                  j === ri ? { ...r, price: e.target.value } : r,
                                                ),
                                              }
                                            : g,
                                        ),
                                      )
                                    }
                                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-sm read-only:bg-[rgb(var(--surface))]"
                                    placeholder={row.customVolumePricing ? '—' : ''}
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    value={row.discountPercentage}
                                    onChange={(e) =>
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) =>
                                          i === gi
                                            ? {
                                                ...g,
                                                subRows: g.subRows.map((r, j) =>
                                                  j === ri ? { ...r, discountPercentage: e.target.value } : r,
                                                ),
                                              }
                                            : g,
                                        ),
                                      )
                                    }
                                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-sm"
                                  />
                                </td>
                                <td className="px-2 py-2 text-sm font-semibold tabular-nums">
                                  ₹{fp.toLocaleString('en-IN')}
                                </td>
                                <td className="p-1">
                                  <input
                                    value={row.stock}
                                    onChange={(e) =>
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) =>
                                          i === gi
                                            ? {
                                                ...g,
                                                subRows: g.subRows.map((r, j) =>
                                                  j === ri ? { ...r, stock: e.target.value } : r,
                                                ),
                                              }
                                            : g,
                                        ),
                                      )
                                    }
                                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-sm"
                                  />
                                </td>
                                <td className="p-1 text-center">
                                  <input
                                    type="checkbox"
                                    checked={row.isPopular}
                                    onChange={(e) =>
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) =>
                                          i === gi
                                            ? {
                                                ...g,
                                                subRows: g.subRows.map((r, j) =>
                                                  j === ri ? { ...r, isPopular: e.target.checked } : r,
                                                ),
                                              }
                                            : g,
                                        ),
                                      )
                                    }
                                  />
                                </td>
                                <td className="p-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVariantGroups((groups) =>
                                        groups.map((g, i) => {
                                          if (i !== gi) return g
                                          const next = g.subRows.filter((_, j) => j !== ri)
                                          return { ...g, subRows: next.length ? next : [emptyVariantRow()] }
                                        }),
                                      )
                                    }
                                    className="rounded-lg border border-red-200 px-2 py-1 text-red-700"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                              {row.customVolumePricing ? (
                                <tr className="border-b border-[rgb(var(--border))] bg-white">
                                  <td colSpan={9} className="px-3 py-2">
                                    <div className="flex flex-col gap-2 text-[11px]">
                                      {row.legacyAreaPricing ? (
                                        <p className="text-[rgb(var(--muted))]">
                                          Legacy ₹/sq.in × L × W — shown as ₹/cu.in for editing (÷ thickness).
                                        </p>
                                      ) : (
                                        <p className="text-[rgb(var(--muted))]">
                                          Store: customer enters L×W; thickness from this row. Price = rate × L×W×T.
                                          Leave vol min/max 0 to enforce only L×W bounds below.
                                        </p>
                                      )}
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                      <span className="font-semibold text-[rgb(var(--muted))]">₹ / cu.in.</span>
                                      <input
                                        value={row.pricePerCubicInch}
                                        onChange={(e) =>
                                          setVariantGroups((groups) =>
                                            groups.map((g, i) =>
                                              i === gi
                                                ? {
                                                    ...g,
                                                    subRows: g.subRows.map((r, j) =>
                                                      j === ri ? { ...r, pricePerCubicInch: e.target.value } : r,
                                                    ),
                                                  }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="w-24 rounded-lg border border-[rgb(var(--border))] px-2 py-1.5 text-sm"
                                        placeholder="12"
                                      />
                                      {!row.legacyAreaPricing ? (
                                        <>
                                          <span className="text-[rgb(var(--muted))]">Vol min–max (cu.in.)</span>
                                          <input
                                            value={row.customMinVolumeCuIn}
                                            onChange={(e) =>
                                              setVariantGroups((groups) =>
                                                groups.map((g, i) =>
                                                  i === gi
                                                    ? {
                                                        ...g,
                                                        subRows: g.subRows.map((r, j) =>
                                                          j === ri ? { ...r, customMinVolumeCuIn: e.target.value } : r,
                                                        ),
                                                      }
                                                    : g,
                                                ),
                                              )
                                            }
                                            className="w-20 rounded-lg border border-[rgb(var(--border))] px-2 py-1.5 text-sm"
                                            placeholder="0"
                                          />
                                          <input
                                            value={row.customMaxVolumeCuIn}
                                            onChange={(e) =>
                                              setVariantGroups((groups) =>
                                                groups.map((g, i) =>
                                                  i === gi
                                                    ? {
                                                        ...g,
                                                        subRows: g.subRows.map((r, j) =>
                                                          j === ri ? { ...r, customMaxVolumeCuIn: e.target.value } : r,
                                                        ),
                                                      }
                                                    : g,
                                                ),
                                              )
                                            }
                                            className="w-20 rounded-lg border border-[rgb(var(--border))] px-2 py-1.5 text-sm"
                                            placeholder="0"
                                          />
                                        </>
                                      ) : null}
                                      <span className="text-[rgb(var(--muted))]">L min–max (in)</span>
                                      <input
                                        value={row.customMinLengthIn}
                                        onChange={(e) =>
                                          setVariantGroups((groups) =>
                                            groups.map((g, i) =>
                                              i === gi
                                                ? {
                                                    ...g,
                                                    subRows: g.subRows.map((r, j) =>
                                                      j === ri ? { ...r, customMinLengthIn: e.target.value } : r,
                                                    ),
                                                  }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="w-16 rounded-lg border border-[rgb(var(--border))] px-2 py-1.5 text-sm"
                                      />
                                      <input
                                        value={row.customMaxLengthIn}
                                        onChange={(e) =>
                                          setVariantGroups((groups) =>
                                            groups.map((g, i) =>
                                              i === gi
                                                ? {
                                                    ...g,
                                                    subRows: g.subRows.map((r, j) =>
                                                      j === ri ? { ...r, customMaxLengthIn: e.target.value } : r,
                                                    ),
                                                  }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="w-16 rounded-lg border border-[rgb(var(--border))] px-2 py-1.5 text-sm"
                                      />
                                      <span className="text-[rgb(var(--muted))]">W min–max (in)</span>
                                      <input
                                        value={row.customMinWidthIn}
                                        onChange={(e) =>
                                          setVariantGroups((groups) =>
                                            groups.map((g, i) =>
                                              i === gi
                                                ? {
                                                    ...g,
                                                    subRows: g.subRows.map((r, j) =>
                                                      j === ri ? { ...r, customMinWidthIn: e.target.value } : r,
                                                    ),
                                                  }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="w-16 rounded-lg border border-[rgb(var(--border))] px-2 py-1.5 text-sm"
                                      />
                                      <input
                                        value={row.customMaxWidthIn}
                                        onChange={(e) =>
                                          setVariantGroups((groups) =>
                                            groups.map((g, i) =>
                                              i === gi
                                                ? {
                                                    ...g,
                                                    subRows: g.subRows.map((r, j) =>
                                                      j === ri ? { ...r, customMaxWidthIn: e.target.value } : r,
                                                    ),
                                                  }
                                                : g,
                                            ),
                                          )
                                        }
                                        className="w-16 rounded-lg border border-[rgb(var(--border))] px-2 py-1.5 text-sm"
                                      />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-[rgb(var(--border))] bg-white px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setVariantGroups((groups) =>
                          groups.map((g, i) =>
                            i === gi ? { ...g, subRows: [...g.subRows, emptyVariantRow()] } : g,
                          ),
                        )
                      }
                      className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-xs font-semibold"
                    >
                      + Add size / thickness row
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setVariantGroups((groups) => [
                    ...groups,
                    { id: newVariantGroupId(), category: 'Double', subRows: [emptyVariantRow()] },
                  ])
                }
                className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-semibold"
              >
                + Add mattress type
              </button>
              <button
                type="button"
                onClick={() =>
                  setVariantGroups((groups) => [
                    ...groups,
                    {
                      id: newVariantGroupId(),
                      category: 'Custom',
                      subRows: [
                        {
                          ...emptyVariantRow(),
                          customVolumePricing: true,
                          legacyAreaPricing: false,
                          size: 'custom',
                          thickness: '6 inch',
                          stock: '999',
                          pricePerCubicInch: '12',
                          customMinVolumeCuIn: '0',
                          customMaxVolumeCuIn: '0',
                        },
                      ],
                    },
                  ])
                }
                className="rounded-xl border border-[rgb(var(--brand))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-semibold text-[rgb(var(--brand))]"
              >
                + Add Custom type (volume pricing)
              </button>
            </div>
          </Section>

          <Section title="4. Specifications">
            {specRows.map((row, idx) => (
              <div key={idx} className="flex flex-wrap gap-2">
                <input
                  value={row.title}
                  onChange={(e) =>
                    setSpecRows((rows) => rows.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r)))
                  }
                  placeholder="Title"
                  className="min-w-[8rem] flex-1 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
                />
                <input
                  value={row.value}
                  onChange={(e) =>
                    setSpecRows((rows) => rows.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))
                  }
                  placeholder="Value"
                  className="min-w-[8rem] flex-[2] rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSpecRows((rows) => rows.filter((_, i) => i !== idx))}
                  className="rounded-xl border border-red-200 px-3 py-2 text-xs text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSpecRows((rows) => [...rows, { title: '', value: '' }])}
              className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-semibold"
            >
              + Add specification
            </button>
          </Section>

          <Section title="6. Pincode delivery">
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
              <div className="text-xs font-semibold text-[rgb(var(--fg))]">Delivery zone (radius)</div>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Set a center pincode and radius in km. Any customer pincode within that distance is deliverable
                (approximate, using map coordinates). When this is set, it is used instead of the pincode list below.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex min-w-[10rem] flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
                    Center pincode
                  </label>
                  <input
                    value={deliveryCenterPincode}
                    onChange={(e) => setDeliveryCenterPincode(e.target.value)}
                    placeholder="560066"
                    maxLength={8}
                    inputMode="numeric"
                    className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex w-28 flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
                    Radius (km)
                  </label>
                  <input
                    value={deliveryRadiusKm}
                    onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                    placeholder="30"
                    inputMode="decimal"
                    className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex w-28 flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
                    Days (ETA)
                  </label>
                  <input
                    value={radiusDeliveryDays}
                    onChange={(e) => setRadiusDeliveryDays(e.target.value)}
                    placeholder="3"
                    inputMode="numeric"
                    className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-[rgb(var(--muted))]">
              Pincode list (optional): use when you are not using radius mode, or leave radius fields empty.
            </p>
            {pinRows.map((row, idx) => (
              <div key={idx} className="flex flex-wrap gap-2">
                <input
                  value={row.pincode}
                  onChange={(e) =>
                    setPinRows((rows) => rows.map((r, i) => (i === idx ? { ...r, pincode: e.target.value } : r)))
                  }
                  placeholder="560001"
                  className="w-28 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
                />
                <input
                  value={row.deliveryDays}
                  onChange={(e) =>
                    setPinRows((rows) => rows.map((r, i) => (i === idx ? { ...r, deliveryDays: e.target.value } : r)))
                  }
                  placeholder="Days"
                  className="w-24 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setPinRows((rows) => rows.filter((_, i) => i !== idx))}
                  className="rounded-xl border border-red-200 px-3 py-2 text-xs text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPinRows((rows) => [...rows, { pincode: '', deliveryDays: '3' }])}
              className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-semibold"
            >
              + Add pincode
            </button>
          </Section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={() => void submit()}
              className="rounded-xl bg-[rgb(var(--brand))] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update product' : 'Create product'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setSuccess('')
                  setError('')
                }}
                className="rounded-xl border border-[rgb(var(--border))] px-6 py-3 text-sm font-semibold"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Catalog</h2>
        <div className="mt-4 divide-y divide-[rgb(var(--border))]">
          {items === null ? (
            <div className="py-6 text-sm text-[rgb(var(--muted))]">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-6 text-sm text-[rgb(var(--muted))]">No products</div>
          ) : (
            items.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-semibold">{p.productName}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">
                    {p.modelName} · {p.variants?.length ?? 0} variants · from ₹
                    {(p.minFinalPrice ?? 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void startEdit(p)}
                    className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Delete this product?')) return
                      try {
                        await adminDelete(`/products/${p._id}`)
                        await load()
                      } catch (e: any) {
                        setError(e?.response?.data?.error ?? 'Delete failed')
                      }
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
