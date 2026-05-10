import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { fetchCategories, fetchProducts } from '../api/catalog'
import type { Category, Product } from '../types/catalog'
import { CategoryCard } from '../components/CategoryCard'
import { HomeCustomerFeedbackTicker } from '../components/HomeCustomerFeedbackTicker'
import { HomeHeroBanner } from '../components/HomeHeroBanner'
import { ProductCard } from '../components/ProductCard'
import { Skeleton } from '../components/Skeleton'
import uniikLogo from '../assets/uniik.png'

const trustItems = [
  {
    title: 'Premium craftsmanship',
    body: 'Precision-built with refined detailing in every piece.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Weather-resistant materials',
    body: 'Crafted to perform beautifully through changing seasons.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: 'Modern design approach',
    body: 'Contemporary silhouettes that elevate outdoor living.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    title: 'Long-lasting durability',
    body: 'Engineered for strength, stability, and daily use.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 14l4 4L20 6" />
      </svg>
    ),
  },
  {
    title: 'Custom manufacturing solutions',
    body: 'Tailored outdoor furniture for unique spaces and projects.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6v12m6-6H6" />
      </svg>
    ),
  },
]

/** Shown below the “Sleep rooted in nature” block — `frontend/public/images/hero-after.png` */
const HERO_AFTER_IMAGE_SRC = '/images/hero-after.png'
/** After “Shop by category” — add `frontend/public/images/after-categories.png` (or .jpg). */
const AFTER_CATEGORIES_IMAGE_SRC = '/images/after-categories.png'

export function HomePage() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [best, setBest] = useState<Product[] | null>(null)
  const [heroAfterImageOk, setHeroAfterImageOk] = useState(true)
  const [afterCategoriesImageOk, setAfterCategoriesImageOk] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([fetchCategories(), fetchProducts({ page: 1, limit: 8, sort: 'popularity' })])
      .then(([cats, prod]) => {
        if (!alive) return
        setCategories(cats)
        setBest(prod.items)
      })
      .catch(() => {
        if (!alive) return
        setCategories([])
        setBest([])
      })
    return () => {
      alive = false
    }
  }, [])

  const displayCategories = useMemo(() => {
    if (!categories?.length) return []
    const sortCat = (a: Category, b: Category) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
    const roots = categories.filter((c) => !c.parentId).sort(sortCat)
    return roots.length ? roots : categories.slice().sort(sortCat)
  }, [categories])

  return (
    <>
      <Helmet>
        <title>Uniik — Premium Outdoor Furniture Manufacturing</title>
        <meta
          name="description"
          content="Uniik crafts premium outdoor furniture with modern design, weather-resistant materials, and lasting comfort for elegant outdoor spaces."
        />
      </Helmet>

      <HomeHeroBanner />

      <section className="bg-[rgb(var(--hero))]">
        <div className="container-page py-12 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand))]">
              Uniik
            </p>
            <h1 className="heading-display mt-4">Crafting Premium Outdoor Living</h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[rgb(var(--muted))]">
              Designed for durability, comfort, and timeless style - premium outdoor furniture crafted to elevate every
              outdoor space.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-full bg-[#f5f0e8] px-8 py-3.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e8e2d6] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900/35"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {heroAfterImageOk ? (
        <section className="w-full bg-[rgb(var(--surface))]" aria-label="Featured image">
          <img
            src={HERO_AFTER_IMAGE_SRC}
            alt="Uniik premium outdoor furniture showcase"
            className="block h-auto w-full max-w-full align-middle"
            loading="lazy"
            decoding="async"
            onError={() => setHeroAfterImageOk(false)}
          />
        </section>
      ) : null}

      <section className="border-y border-[rgb(var(--border))] bg-black">
        <div className="container-page py-14">
          <div className="mx-auto grid w-full max-w-6xl place-items-center justify-center gap-10 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            {trustItems.map((item) => (
              <div key={item.title} className="flex w-full max-w-sm items-center justify-center gap-4">
                <div className="text-white">{item.icon}</div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-sm leading-snug text-white/75">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeCustomerFeedbackTicker />

      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
            Shop by category
          </h2>
          <p className="mt-3 text-base text-[rgb(var(--muted))]">
            Discover outdoor furniture categories crafted for modern open-air spaces.
          </p>
        </div>
        <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
            {categories === null ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)
            ) : displayCategories.length ? (
              displayCategories.slice(0, 8).map((c) => (
                <CategoryCard
                  key={c._id}
                  category={c}
                  preferHub
                  hasChildren={(categories ?? []).some((x) => x.parentId === c._id)}
                />
              ))
            ) : (
              <div className="text-sm text-[rgb(var(--muted))]">No categories yet.</div>
            )}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/categories"
            className="text-sm font-semibold text-[rgb(var(--brand))] underline-offset-4 hover:underline"
          >
            View all categories
          </Link>
        </div>
      </section>

      {afterCategoriesImageOk ? (
        <section className="w-full bg-[rgb(var(--surface))]" aria-label="Featured image after categories">
          <img
            src={AFTER_CATEGORIES_IMAGE_SRC}
            alt="Uniik outdoor furniture collections"
            className="block h-auto w-full max-w-full align-middle"
            loading="lazy"
            decoding="async"
            onError={() => setAfterCategoriesImageOk(false)}
          />
        </section>
      ) : null}

      <section className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <div className="w-full px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:items-center">
            <div className="max-w-xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">Best sellers</h2>
              <p className="mt-3 text-base text-[rgb(var(--muted))]">
                Most-loved outdoor furniture pieces chosen for design and durability.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#f5f0e8] px-8 py-3.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e8e2d6] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900/35"
            >
              Shop all
            </Link>
          </div>
          <div className="mt-10 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {best === null ? (
                Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[420px] rounded-3xl" />)
              ) : best.length ? (
                best.map((p) => <ProductCard key={p._id} product={p} />)
              ) : (
                <div className="text-sm text-[rgb(var(--muted))]">No products yet.</div>
              )}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-black px-6 py-11 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-10 lg:px-14 lg:py-14">
          <div className="grid items-center gap-11 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Our story</p>
              <p className="mt-4 font-header text-2xl font-semibold leading-snug text-white sm:text-3xl lg:text-[2.125rem] lg:leading-[1.2]">
                The evenings that matter don&apos;t stay indoors—they drift into lamplight on the terrace, laughter spilling past
                the last chair you meant to fold away.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-white/80">
                We started Uniik for those unhurried hours: monsoon mist on a railing, a café courtyard filling up again after
                rain, a villa lawn where guests linger barefoot. Outdoor furniture should honour that softness—and survive every
                season India asks of it.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                Every weld, weave, and finish is chosen so beauty isn&apos;t fragile: fewer replacements, quieter maintenance,
                silhouettes that belong in open air for years.
              </p>
              <Link
                to="/about"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#f5f0e8] px-8 py-3.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e8e2d6] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900/35"
              >
                Read more
              </Link>
            </div>
            <div className="flex justify-center lg:justify-end">
              <img
                src={uniikLogo}
                alt="Uniik"
                className="h-36 w-auto max-w-[min(100%,20rem)] object-contain opacity-[0.98] sm:h-44 lg:h-52 xl:h-60"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
