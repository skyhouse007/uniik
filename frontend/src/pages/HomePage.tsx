import { useEffect, useMemo, useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { fetchCategories, fetchProducts } from '../api/catalog'
import type { Category, Product } from '../types/catalog'
import { CategoryCard } from '../components/CategoryCard'
import { ProductCard } from '../components/ProductCard'
import { Skeleton } from '../components/Skeleton'

const trustItems = [
  {
    title: '10-year warranty',
    body: 'Rest easy, year after year.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Free delivery',
    body: 'Straight to your bedroom.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: 'Trusted reviews',
    body: 'Real sleepers, real comfort.',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
]

/** Add your file at `frontend/public/videos/hero.mp4` (H.264 + AAC recommended for broad support). */
const HERO_VIDEO_SRC = '/videos/hero.mp4'
/** Shown below the “Sleep rooted in nature” block — `frontend/public/images/hero-after.png` */
const HERO_AFTER_IMAGE_SRC = '/images/hero-after.png'
/** After “Shop by category” — add `frontend/public/images/after-categories.png` (or .jpg). */
const AFTER_CATEGORIES_IMAGE_SRC = '/images/after-categories.png'

export function HomePage() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [best, setBest] = useState<Product[] | null>(null)
  const [heroVideoActive, setHeroVideoActive] = useState(false)
  const [heroAfterImageOk, setHeroAfterImageOk] = useState(true)
  const [afterCategoriesImageOk, setAfterCategoriesImageOk] = useState(true)

  const onHeroVideoReady = useCallback(() => setHeroVideoActive(true), [])
  const onHeroVideoError = useCallback(() => setHeroVideoActive(false), [])

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
        <title>CozyFoam — Natural latex mattresses</title>
        <meta
          name="description"
          content="Natural latex and premium foams, cream-soft comfort—shop mattresses with clear delivery and easy returns."
        />
      </Helmet>

      <section className="relative w-full overflow-hidden bg-black" aria-label="Hero video">
        <div className="relative h-[min(85vh,56.25vw)] min-h-[220px] w-full sm:min-h-[280px]">
          <video
            className={
              heroVideoActive
                ? 'absolute inset-0 h-full w-full object-cover'
                : 'pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0'
            }
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="CozyFoam mattress showcase"
            onLoadedData={onHeroVideoReady}
            onError={onHeroVideoError}
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>
          <div
            className={[
              'absolute inset-0 grid place-items-center bg-gradient-to-br from-[rgb(var(--surface))] via-white to-[rgb(var(--hero))] p-8 text-center transition-opacity duration-500',
              heroVideoActive ? 'pointer-events-none opacity-0' : 'opacity-100',
            ].join(' ')}
            aria-hidden={heroVideoActive}
          >
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--brand))]">From the earth, for your sleep</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-[rgb(var(--fg))]">
                Natural latex comfort
              </p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Breathable layers · Plant-based latex · Calm, cream-toned rest
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[rgb(var(--hero))]">
        <div className="container-page py-12 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand))]">
              Natural latex
            </p>
            <h1 className="heading-display mt-4">Sleep rooted in nature.</h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[rgb(var(--muted))]">
              Responsibly sourced latex, soft creams and whites, and supportive foams—honest pricing for nights that
              feel fresh and grounded.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/products"
                className="btn-primary !bg-[rgb(var(--accent-sale))] hover:!bg-[rgb(var(--accent-sale))]/90"
              >
                Shop mattresses
              </Link>
              <Link to="/categories" className="btn-secondary">
                Explore categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {heroAfterImageOk ? (
        <section className="w-full bg-[rgb(var(--surface))]" aria-label="Featured image">
          <img
            src={HERO_AFTER_IMAGE_SRC}
            alt="CozyFoam mattresses and natural materials"
            className="block h-auto w-full max-w-full align-middle"
            loading="lazy"
            decoding="async"
            onError={() => setHeroAfterImageOk(false)}
          />
        </section>
      ) : null}

      <section className="border-y border-[rgb(var(--border))] bg-[rgb(var(--inverse))]">
        <div className="container-page py-14">
          <div className="mx-auto grid w-full max-w-6xl place-items-center justify-center gap-10 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            {trustItems.map((item) => (
              <div key={item.title} className="flex w-full max-w-sm items-center justify-center gap-4">
                <div className="text-[rgb(var(--brand))]">{item.icon}</div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</div>
                  <div className="mt-1 text-sm leading-snug text-[rgb(var(--muted))]">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
            Shop by category
          </h2>
          <p className="mt-3 text-base text-[rgb(var(--muted))]">
            Find the right feel—whether you want plush, firm, or something in between.
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
            alt="CozyFoam shop by category"
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
                Popular picks with top ratings and clear delivery timelines.
              </p>
            </div>
            <Link to="/products" className="btn-secondary shrink-0">
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
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--inverse))] p-8 shadow-sm">
            <h3 className="text-lg font-semibold">Offers & coupons</h3>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
              Apply codes at checkout for extra savings on eligible mattresses.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[rgb(var(--surface))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--brand))] ring-1 ring-[rgb(var(--border))]">
                SLEEP10
              </span>
              <span className="rounded-full bg-[rgb(var(--surface))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--brand))] ring-1 ring-[rgb(var(--border))]">
                COZY15
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--inverse))] p-8 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold">Why customers choose CozyFoam</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <blockquote className="rounded-2xl bg-[rgb(var(--surface))] p-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
                “Delivery was on time and the mattress feels premium from night one.”
              </blockquote>
              <blockquote className="rounded-2xl bg-[rgb(var(--surface))] p-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
                “Checkout was simple and the filters made it easy to compare options.”
              </blockquote>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
