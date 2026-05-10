/** Top-of-home hero; rendered inside Navbar below category nav so it sits flush under the strip. */
const HERO_IMAGE_SRC = '/images/hero-uniik.png'

export function HomeHeroBanner() {
  return (
    <section
      className="relative w-full scroll-mt-[var(--site-header-height)] overflow-hidden bg-page-gradient"
      aria-label="Hero image"
    >
      <div className="relative w-full aspect-[16/9]">
        <img
          src={HERO_IMAGE_SRC}
          alt="Uniik premium outdoor living hero"
          className="absolute inset-0 h-full w-full object-cover transform-gpu"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
    </section>
  )
}
