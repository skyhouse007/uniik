import { useEffect, useState } from 'react'

type FeedbackItem = {
  quote: string
  name: string
  venue: string
  tag: 'Villa' | 'Café'
}

const FEEDBACK: FeedbackItem[] = [
  {
    quote:
      'Pool decks and cabanas stay immaculate — guests constantly ask where we sourced the loungers. Weather-proof without looking industrial.',
    name: 'Meera Krishnan',
    venue: 'Azure Bay Villas · Alibaug',
    tag: 'Villa',
  },
  {
    quote:
      'High turnover terrace seating used to wear out fast. Uniik pieces still look sharp after two monsoons and daily service.',
    name: 'Rahul Menon',
    venue: 'North Bean Roastery · Bengaluru',
    tag: 'Café',
  },
  {
    quote:
      'We needed low-maintenance outdoor dining that matched a boutique aesthetic. Delivered on time and the finish feels bespoke.',
    name: 'Ananya Bose',
    venue: 'The Slate Homestay · Kasauli',
    tag: 'Villa',
  },
  {
    quote:
      'Courtyard tables take spills, heat, and Bangalore drizzle — frames stay steady and cushions recover shape.',
    name: 'Farhan Sheikh',
    venue: 'Third Wave Collective · Koramangala',
    tag: 'Café',
  },
  {
    quote:
      'Custom lengths for our wraparound deck — engineering felt thoughtful and the powder coating still looks factory-new.',
    name: 'Vikram & Dia Patel',
    venue: 'Laterite Cliff Villas · North Goa',
    tag: 'Villa',
  },
]

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  return (
    <figure className="flex h-full min-w-[min(100vw-3rem,22rem)] max-w-[22rem] shrink-0 flex-col rounded-2xl border border-neutral-700 bg-neutral-950 p-5 shadow-sm">
      <span className="inline-flex w-fit rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-100 ring-1 ring-white/15">
        {item.tag}
      </span>
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-neutral-300">&ldquo;{item.quote}&rdquo;</blockquote>
      <figcaption className="mt-4 border-t border-neutral-800 pt-4">
        <div className="text-sm font-semibold text-neutral-50">{item.name}</div>
        <div className="mt-0.5 text-xs text-neutral-500">{item.venue}</div>
      </figcaption>
    </figure>
  )
}

export function HomeCustomerFeedbackTicker() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <section className="border-y border-neutral-800 bg-black py-12 lg:py-14" aria-labelledby="home-feedback-heading">
      <div className="container-page mb-8 max-w-4xl text-center lg:mb-10 lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Hospitality partners</p>
        <h2 id="home-feedback-heading" className="mt-2 font-header text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">
          Feedback from our customers
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-400 lg:mx-0">
          Outdoor seating that survives real weather and heavy footfall — hear from property owners and café operators who specify Uniik.
        </p>
      </div>

      {reducedMotion ? (
        <div className="container-page overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-4 pb-2">
            {FEEDBACK.map((item, i) => (
              <FeedbackCard key={item.name + item.venue + i} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent sm:w-20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent sm:w-20"
            aria-hidden
          />

          <div className="overflow-hidden">
            <div className="animate-home-feedback-marquee flex w-max gap-4 pr-4">
              <div className="flex gap-4">
                {FEEDBACK.map((item, i) => (
                  <FeedbackCard key={`m1-${i}`} item={item} />
                ))}
              </div>
              <div className="flex gap-4" aria-hidden>
                {FEEDBACK.map((item, i) => (
                  <FeedbackCard key={`m2-${i}`} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
