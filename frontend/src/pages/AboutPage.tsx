import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <Helmet>
        <title>About Uniik — Premium Outdoor Furniture</title>
        <meta
          name="description"
          content="Uniik crafts premium outdoor furniture in India—designed for slow evenings, monsoon-ready resilience, and spaces where people actually gather."
        />
      </Helmet>

      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">About Uniik</p>
        <h1 className="heading-display mt-4 text-[rgb(var(--fg))]">Built for the outdoors—and for the life that happens there</h1>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-[rgb(var(--muted))]">
          <p className="text-[rgb(var(--fg))]">
            Some memories only happen outside: the first cup of coffee while the terrace is still cool, cousins squeezed onto
            garden chairs long after dinner, a café courtyard humming through golden hour. Uniik exists so those moments sit on
            furniture that feels considered—not disposable.
          </p>
          <p>
            We are makers at heart. Every frame, weave, and finish is chosen to survive Indian weather without apologising for
            itself: sun that bleaches careless materials, humidity that warps shortcuts, monsoon bursts that test seals and
            joints. When we specify powder coats, textiles, and timber treatments, we are thinking about your balcony in May and
            your resort lawn in August.
          </p>
          <p>
            Hospitality teams push furniture harder than almost anyone—turnover, spills, stacking, deep cleaning—so we listen when
            villa hosts and café owners tell us what breaks first. That feedback loops straight back into how we design profiles,
            weld joints, and package pieces for safe installs.
          </p>
          <p>
            Sustainability, for us, is durability with discipline: fewer replacements, honest materials, and forms that stay
            relevant season after season. We would rather you buy once and love it for years than chase trends that age in a single
            summer.
          </p>
          <p>
            Whether you are furnishing a quiet home patio or a busy outdoor service floor, we bring the same obsession—quiet
            comfort, confident strength, and silhouettes that belong in open air.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-full bg-[#f5f0e8] px-8 py-3.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e8e2d6] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900/35"
          >
            Explore collection
          </Link>
          <Link
            to="/bulk-order"
            className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-8 py-3.5 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-[rgb(var(--muted))]"
          >
            Project &amp; bulk enquiry
          </Link>
        </div>
      </article>
    </div>
  )
}
