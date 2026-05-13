import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProduct, fetchProducts } from '../api/catalog'
import { fetchReviews } from '../api/reviews'
import type { Product, Review } from '../types/catalog'
import { Breadcrumb } from '../components/Breadcrumb'
import { ReviewSection } from '../components/ReviewSection'
import { Skeleton } from '../components/Skeleton'
import { ProductCard } from '../components/ProductCard'
import { ProductGallery } from '../components/product/ProductGallery'
import { VariantSelector } from '../components/product/VariantSelector'
import { PriceDisplay } from '../components/product/PriceDisplay'
import { DeliveryChecker } from '../components/product/DeliveryChecker'
import { PaymentTrustSection } from '../components/payment/PaymentTrustSection'
import { SpecificationTable } from '../components/product/SpecificationTable'
import { useAppDispatch } from '../store/hooks'
import { cartActions } from '../store/slices/cartSlice'
import { recentlyViewedActions } from '../store/slices/recentlyViewedSlice'
import {
  buildSimpleCustomVirtualVariant,
  clampCustomDimensions,
  defaultCustomSizeString,
  findProductVariant,
  isCustomAreaVariant,
  isCustomOnlyVariantPool,
  parseMattressSizeInches,
  productCheapestSelection,
  productMinVariant,
  productPrimaryImage,
  productUsesSimpleCustom,
  productUsesVariantCategories,
  simpleCustomCategoryMatches,
  variantBounds,
  variantDisplayBasePrice,
  variantDisplayPrice,
  variantEffectiveFinal,
} from '../utils/product'

export function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedVariantCategory, setSelectedVariantCategory] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedThickness, setSelectedThickness] = useState('')
  const [customLength, setCustomLength] = useState('72')
  const [customWidth, setCustomWidth] = useState('48')

  useEffect(() => {
    if (!id) return
    let alive = true
    setProduct(null)
    fetchProduct(id)
      .then(async (p) => {
        if (!alive) return
        setProduct(p)
        const pick = productCheapestSelection(p)
        const first = p.variants?.[0]
        setSelectedVariantCategory(pick?.variantCategory ?? '')
        setSelectedSize(pick?.size ?? first?.size ?? '')
        setSelectedThickness(pick?.thickness ?? first?.thickness ?? '')
        const parsedLw = pick?.size ? parseMattressSizeInches(pick.size) : null
        if (parsedLw) {
          setCustomLength(String(parsedLw.lengthIn))
          setCustomWidth(String(parsedLw.widthIn))
        } else if (pick?.size && /^v\d+/i.test(String(pick.size).trim())) {
          const cat = String(pick.variantCategory ?? '').trim()
          const row =
            p.variants?.find(
              (x) => String(x.variantCategory ?? '').trim() === cat && x.thickness === pick.thickness,
            ) ?? p.variants?.[0]
          const def = row ? defaultCustomSizeString(row).split('x') : ['72', '48']
          setCustomLength(def[0] ?? '72')
          setCustomWidth(def[1] ?? '48')
        } else {
          setCustomLength('72')
          setCustomWidth('48')
        }
        dispatch(recentlyViewedActions.viewed(p._id))
        fetchReviews(p._id)
          .then((r) => alive && setReviews(r))
          .catch(() => alive && setReviews([]))
        const catId = typeof p.category === 'string' ? p.category : p.category?._id
        const rel = await fetchProducts({ category: catId, limit: 4, page: 1, sort: 'popularity' })
        if (!alive) return
        setRelated(rel.items.filter((x) => x._id !== p._id).slice(0, 4))
      })
      .catch(() => alive && setProduct(null))
    return () => {
      alive = false
    }
  }, [dispatch, id])

  const customOnlyActive = useMemo(() => {
    if (!product) return false
    const cat = String(selectedVariantCategory ?? '').trim()
    if (simpleCustomCategoryMatches(product, cat)) {
      const pool = product.variants?.filter((v) => String(v.variantCategory ?? '').trim() === cat) ?? []
      const hasRowCustomVol = pool.some(
        (v) => v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0,
      )
      if (!hasRowCustomVol) return true
      return isCustomOnlyVariantPool(pool)
    }
    if (!product.variants?.length) return false
    const pool = product.variants.filter((v) => String(v.variantCategory ?? '').trim() === cat)
    const all = product.variants ?? []
    return isCustomOnlyVariantPool(pool) || (!productUsesVariantCategories(product) && isCustomOnlyVariantPool(all))
  }, [product, selectedVariantCategory])

  const customTemplateVariant = useMemo(() => {
    if (!product || !customOnlyActive) return null
    const cat = String(selectedVariantCategory ?? '').trim()
    if (simpleCustomCategoryMatches(product, cat)) {
      const pool = product.variants?.filter((v) => String(v.variantCategory ?? '').trim() === cat) ?? []
      const hasRowCustomVol = pool.some(
        (v) => v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0,
      )
      if (!hasRowCustomVol) {
        return buildSimpleCustomVirtualVariant(product, selectedThickness) ?? null
      }
    }
    if (!product.variants?.length) return null
    const pool = product.variants.filter((v) => String(v.variantCategory ?? '').trim() === cat)
    const all = product.variants ?? []
    const effectivePool =
      !productUsesVariantCategories(product) && isCustomOnlyVariantPool(all) ? all : pool
    if (!isCustomOnlyVariantPool(effectivePool)) return null
    return effectivePool.find((v) => v.thickness === selectedThickness) ?? effectivePool[0] ?? null
  }, [product, selectedVariantCategory, selectedThickness, customOnlyActive])

  const effectiveSize = useMemo(() => {
    if (!customOnlyActive) return selectedSize
    const tmpl = customTemplateVariant
    if (!tmpl) return ''
    const l = Math.round(Number(customLength) || 0)
    const w = Math.round(Number(customWidth) || 0)
    if (l <= 0 || w <= 0) return ''
    return `${l}x${w}`
  }, [customOnlyActive, selectedSize, customLength, customWidth, customTemplateVariant])

  useEffect(() => {
    if (!product?.variants?.length) return
    const cat = String(selectedVariantCategory ?? '').trim()
    const pool = product.variants.filter((v) => String(v.variantCategory ?? '').trim() === cat)
    if (isCustomOnlyVariantPool(pool)) return
    if (!productUsesVariantCategories(product) && isCustomOnlyVariantPool(product.variants ?? [])) return
    const sizes = [...new Set(pool.map((v) => v.size))]
    if (!sizes.includes(selectedSize) && sizes[0]) {
      setSelectedSize(sizes[0])
    }
  }, [product, selectedVariantCategory, selectedSize])

  useEffect(() => {
    if (!product) return
    const cat = String(selectedVariantCategory ?? '').trim()
    if (
      productUsesSimpleCustom(product) &&
      (!product.variants?.length || simpleCustomCategoryMatches(product, cat))
    ) {
      const opts = product.simpleCustomPricing?.thicknessOptions ?? []
      if (opts.length && !opts.includes(selectedThickness) && opts[0]) {
        setSelectedThickness(opts[0])
      }
      return
    }
    if (!product.variants?.length) return
    const pool = product.variants.filter((v) => String(v.variantCategory ?? '').trim() === cat)
    const all = product.variants ?? []
    const effectivePool =
      !productUsesVariantCategories(product) && isCustomOnlyVariantPool(all) ? all : pool

    if (isCustomOnlyVariantPool(effectivePool)) {
      const thicknesses = [...new Set(effectivePool.map((v) => v.thickness))]
      if (!thicknesses.includes(selectedThickness) && thicknesses[0]) {
        setSelectedThickness(thicknesses[0])
      }
      return
    }
    const forSize = effectivePool.filter((v) => v.size === selectedSize)
    const thicknesses = [...new Set(forSize.map((v) => v.thickness))]
    if (!thicknesses.includes(selectedThickness) && thicknesses[0]) {
      setSelectedThickness(thicknesses[0])
    }
  }, [product, selectedVariantCategory, selectedSize, selectedThickness])

  const variant = useMemo(() => {
    if (!product || !effectiveSize) return null
    return findProductVariant(product, selectedVariantCategory, effectiveSize, selectedThickness) ?? null
  }, [product, selectedVariantCategory, effectiveSize, selectedThickness])

  const displayFinal = useMemo(
    () => (variant ? variantDisplayPrice(variant, effectiveSize) : 0),
    [variant, effectiveSize],
  )
  const displayBase = useMemo(
    () => (variant ? variantDisplayBasePrice(variant, effectiveSize) : 0),
    [variant, effectiveSize],
  )

  function handleVariantCategoryChange(c: string) {
    setSelectedVariantCategory(c)
    if (!product || (productUsesSimpleCustom(product) && !product.variants?.length)) return
    const pool = product.variants.filter((v) => String(v.variantCategory ?? '').trim() === String(c).trim())
    if (!isCustomOnlyVariantPool(pool)) return
    const tmpl = pool.find((v) => v.thickness === selectedThickness) ?? pool[0]
    if (!tmpl || !isCustomAreaVariant(tmpl)) return
    const volumeMode = Number(tmpl.pricePerCubicInch) > 0 && tmpl.pricingMode !== 'custom_area'
    const { minL, minW } = variantBounds(tmpl)
    if (volumeMode) {
      const c = clampCustomDimensions(
        tmpl,
        Number(customLength) || minL,
        Number(customWidth) || minW,
      )
      setCustomLength(String(c.lengthIn))
      setCustomWidth(String(c.widthIn))
    } else {
      const def = defaultCustomSizeString(tmpl).split('x')
      setCustomLength(def[0] ?? String(minL))
      setCustomWidth(def[1] ?? String(minW))
    }
  }

  function handleThicknessChange(t: string) {
    setSelectedThickness(t)
    if (!product) return
    const cat = String(selectedVariantCategory ?? '').trim()
    if (simpleCustomCategoryMatches(product, cat)) {
      const pool = product.variants?.filter((v) => String(v.variantCategory ?? '').trim() === cat) ?? []
      const hasRowCustomVol = pool.some(
        (v) => v.pricingMode === 'custom_volume' && Number(v.pricePerCubicInch) > 0,
      )
      if (!hasRowCustomVol) {
        const tmpl = buildSimpleCustomVirtualVariant(product, t)
        if (!tmpl) return
        const { minL, minW } = variantBounds(tmpl)
        const c = clampCustomDimensions(tmpl, Number(customLength) || minL, Number(customWidth) || minW)
        setCustomLength(String(c.lengthIn))
        setCustomWidth(String(c.widthIn))
        return
      }
    }
    const pool = product.variants.filter((v) => String(v.variantCategory ?? '').trim() === cat)
    const all = product.variants ?? []
    const effectivePool =
      !productUsesVariantCategories(product) && isCustomOnlyVariantPool(all) ? all : pool
    if (!isCustomOnlyVariantPool(effectivePool)) return
    const tmpl = effectivePool.find((v) => v.thickness === t) ?? effectivePool[0]
    if (!tmpl || !isCustomAreaVariant(tmpl)) return
    const { minL, minW } = variantBounds(tmpl)
    const c = clampCustomDimensions(
      tmpl,
      Number(customLength) || minL,
      Number(customWidth) || minW,
    )
    setCustomLength(String(c.lengthIn))
    setCustomWidth(String(c.widthIn))
  }

  const minVariant = useMemo(() => (product ? productMinVariant(product) : null), [product])
  const multivariant = product
    ? (product.variants?.length ?? 0) > 1 ||
      (product.simpleCustomPricing?.thicknessOptions?.length ?? 0) > 1 ||
      !!(productUsesSimpleCustom(product) && (product.variants?.length ?? 0) > 0)
    : false
  const fromFloorPrice =
    product && typeof product.minFinalPrice === 'number' && product.minFinalPrice > 0
      ? product.minFinalPrice
      : minVariant
        ? variantEffectiveFinal(minVariant)
        : undefined

  if (!id) {
    return (
      <div className="container-page py-10">
        <div className="text-sm text-[rgb(var(--muted))]">Invalid product id.</div>
      </div>
    )
  }

  const canAddToCart =
    !!product &&
    !!variant &&
    variant.stock >= 1 &&
    !!effectiveSize &&
    displayFinal > 0

  const addPayload =
    product && variant && canAddToCart
      ? {
          productId: product._id,
          name: product.productName,
          image: productPrimaryImage(product),
          unitPrice: displayFinal,
          selectedVariantCategory: String(selectedVariantCategory ?? '').trim(),
          selectedSize: effectiveSize,
          selectedThickness,
        }
      : undefined

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>{product ? `${product.productName} — Uniik` : 'Product — Uniik'}</title>
        <meta name="description" content={product?.shortDescription ?? 'Premium outdoor furniture details'} />
      </Helmet>

      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          { label: product?.productName ?? 'Loading…' },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div>
          {product ? (
            <ProductGallery product={product} />
          ) : (
            <Skeleton className="aspect-square rounded-2xl" />
          )}

          <div className="mt-10 grid gap-7">
            <section className="rounded-3xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition hover:border-white/18">
              <div className="font-header text-base font-semibold tracking-tight text-[rgb(var(--fg))]">
                About this product
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {product ? product.shortDescription : 'Loading…'}
              </p>
              <div className="mt-4 text-sm leading-relaxed text-[rgb(var(--fg))]">
                {product ? product.fullDescription : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition hover:border-white/18">
              <div className="font-header text-base font-semibold tracking-tight text-[rgb(var(--fg))]">
                Specifications
              </div>
              <div className="mt-3">
                {product ? <SpecificationTable specifications={product.specifications ?? []} /> : null}
              </div>
            </section>

            <ReviewSection reviews={reviews} />

            <section className="rounded-3xl border border-white/12 bg-black/45 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition hover:border-white/18">
              <div className="font-header text-base font-semibold tracking-tight text-[rgb(var(--fg))]">FAQ</div>
              <div className="mt-4 divide-y divide-white/10">
                {[
                  {
                    q: 'Is this suitable for outdoor use?',
                    a: 'Materials and finishes are chosen for open-air durability. Check specifications for care and exposure guidance for your climate.',
                  },
                  {
                    q: 'How long does delivery take?',
                    a: product?.deliveryTimeline ?? 'Delivery timelines vary by location.',
                  },
                  {
                    q: 'How do I clean or maintain it?',
                    a: 'Follow the care notes in the specifications and any labels on the product for best results.',
                  },
                  {
                    q: 'What is the warranty?',
                    a: product?.warrantyPeriod ?? 'Warranty details are listed above.',
                  },
                ].map((item) => (
                  <details key={item.q} className="group py-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[rgb(var(--fg))]">
                      <span className="inline-flex items-center justify-between gap-3">
                        {item.q}
                        <span className="text-[rgb(var(--muted))] transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <div className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-white/12 bg-black/45 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm lg:sticky lg:top-[96px]">
          {product ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {product.brand}
              </div>
              <h1 className="font-header mt-2 text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-[28px]">
                {product.productName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <span className="font-medium text-[rgb(var(--fg))]">{product.rating.toFixed(1)} ★</span>
                <span aria-hidden className="text-[rgb(var(--border))]">
                  ·
                </span>
                <span className="text-[13px] text-white/80">Premium quality</span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {product.shortDescription}
              </p>

              {variant ? (
                <>
                  {variant.isPopular ? (
                    <div className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm">
                      Most popular choice
                    </div>
                  ) : null}
                  <div className="mt-5">
                    <PriceDisplay
                      basePrice={displayBase}
                      finalPrice={displayFinal}
                      discountPercentage={variant.discountPercentage}
                      fromFinalPrice={fromFloorPrice}
                      multivariant={multivariant}
                    />
                  </div>

                  <div className="mt-5 grid gap-2">
                    <button
                      type="button"
                      disabled={!addPayload}
                      onClick={() => {
                        if (!addPayload) return
                        dispatch(cartActions.addToCart(addPayload))
                      }}
                      className="rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-200 hover:shadow-md disabled:opacity-50"
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      disabled={!addPayload}
                      onClick={() => {
                        if (!addPayload) return
                        dispatch(cartActions.addToCart(addPayload))
                        navigate('/checkout')
                      }}
                      className="rounded-2xl border border-white/25 bg-transparent px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:border-white/45 hover:bg-white/10 disabled:opacity-50"
                    >
                      Buy now
                    </button>
                    <Link to="/cart" className="text-center text-xs font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline">
                      View cart
                    </Link>
                  </div>

                  <div className="mt-6">
                    <VariantSelector
                      product={product}
                      selectedVariantCategory={selectedVariantCategory}
                      selectedSize={selectedSize}
                      selectedThickness={selectedThickness}
                      onVariantCategoryChange={handleVariantCategoryChange}
                      onSizeChange={setSelectedSize}
                      onThicknessChange={handleThicknessChange}
                      customLength={customLength}
                      customWidth={customWidth}
                      onCustomLengthChange={setCustomLength}
                      onCustomWidthChange={setCustomWidth}
                    />
                  </div>

                  <div className="mt-4">
                    <PaymentTrustSection price={displayFinal} />
                  </div>
                  <div className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Stock: {variant.stock > 0 ? `${variant.stock} available` : 'Out of stock'}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-4 text-sm text-[rgb(var(--muted))]">
                    {productUsesVariantCategories(product)
                      ? 'Select a top category, then size and thickness below.'
                      : 'Select a size and thickness.'}
                  </div>
                  <div className="mt-6">
                    <VariantSelector
                      product={product}
                      selectedVariantCategory={selectedVariantCategory}
                      selectedSize={selectedSize}
                      selectedThickness={selectedThickness}
                      onVariantCategoryChange={handleVariantCategoryChange}
                      onSizeChange={setSelectedSize}
                      onThicknessChange={handleThicknessChange}
                      customLength={customLength}
                      customWidth={customWidth}
                      onCustomLengthChange={setCustomLength}
                      onCustomWidthChange={setCustomWidth}
                    />
                  </div>
                </>
              )}

              <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/55 p-4 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      Warranty
                    </div>
                    <div className="mt-1 font-medium text-[rgb(var(--fg))]">{product.warrantyPeriod}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      Delivery
                    </div>
                    <div className="mt-1 font-medium text-[rgb(var(--fg))]">{product.deliveryTimeline}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      Returns
                    </div>
                    <div className="mt-1 text-[13px] text-[rgb(var(--muted))]">{product.returnPolicy}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      Safe payment
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-[rgb(var(--fg))]">Secure checkout</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      Support
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-[rgb(var(--fg))]">Chat / call help</div>
                  </div>
                </div>
              </div>

              {id ? (
                <div className="mt-5">
                  <DeliveryChecker productId={id} />
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          )}
        </aside>
      </div>

      {related.length ? (
        <section className="mt-10 border-t border-white/10 pt-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-header text-sm font-semibold text-[rgb(var(--fg))]">Related products</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">More options you may like</div>
            </div>
            <Link to="/products" className="text-xs font-semibold text-white underline-offset-4 hover:underline">
              Browse all
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
