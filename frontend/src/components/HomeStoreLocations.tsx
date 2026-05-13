import { useState } from 'react'

const IMAGE_FALLBACK = '/images/after-categories.png'

const stores = [
  {
    id: 'infantry-road',
    title: 'Infantry Road',
    subtitle: 'Shivajinagar · Bengaluru',
    address: ['Infantry Road', 'Shivajinagar, Bengaluru', 'Karnataka 560001'],
    image: '/images/stores/infantry-road.png',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Infantry+Road%2C+Shivajinagar%2C+Bengaluru+560001',
  },
  {
    id: 'banaswadi',
    title: 'Banaswadi',
    subtitle: 'North Bengaluru',
    address: ['Banaswadi', 'Bengaluru', 'Karnataka 560043'],
    image: '/images/stores/banaswadi.png',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Banaswadi%2C+Bengaluru+560043',
  },
] as const

function StoreCard({
  title,
  subtitle,
  address,
  image,
  mapsUrl,
}: (typeof stores)[number]) {
  const [src, setSrc] = useState<string>(image)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-neutral-700">
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-neutral-800 bg-neutral-900">
        <img
          src={src}
          alt={`Uniik showroom — ${title}`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => {
            setSrc((current) => (current === IMAGE_FALLBACK ? current : IMAGE_FALLBACK))
          }}
        />
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-header text-xl font-semibold tracking-tight text-neutral-50 sm:text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        <address className="mt-4 not-italic text-sm leading-relaxed text-neutral-400">
          {address.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </address>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#f5f0e8] px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e8e2d6] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-100/35 sm:flex-none"
          >
            Visit store
          </a>
        </div>
      </div>
    </article>
  )
}

export function HomeStoreLocations() {
  return (
    <section className="border-t border-neutral-800 bg-black" aria-labelledby="home-store-locations-heading">
      <div className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Showrooms</p>
          <h2 id="home-store-locations-heading" className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">
            Visit our stores
          </h2>
          <p className="mt-3 text-base text-neutral-400">
            Step in, feel the materials, and plan your outdoor space with our team.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 sm:gap-8">
          {stores.map((store) => (
            <StoreCard key={store.id} {...store} />
          ))}
        </div>
      </div>
    </section>
  )
}
