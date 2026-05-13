import { Fragment, useEffect, useState } from 'react'

type TrustDef = {
  title: string
  Icon: ({ className }: { className?: string }) => React.JSX.Element
}

const TRUST_POINTS: TrustDef[] = [
  {
    title: '1L+ customers',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx={9} cy={7} r={3.25} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21v-1.8c0-.8-.51-1.58-1.38-2.06a6.97 6.97 0 00-5.74-.02" />
        <path strokeLinecap="round" d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: 'High quality furniture',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 17h12M8 21h8v-4H8v4zM10 17V13h4v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13h14v-1.5c0-.9-.73-2-2-2h-2V8l-1.5-2h-7L5 10v5z" />
      </svg>
    ),
  },
  {
    title: 'Unbeatable price',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
        <circle cx={11} cy={11} r={6.25} strokeLinecap="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h6m-3-3v6" />
      </svg>
    ),
  },
  {
    title: '100% secure payment',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5.25-3.56 10.74-8 11-4.44-.26-8-5.75-8-11V7l8-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 11.75L11 13l3.25-4" />
      </svg>
    ),
  },
  {
    title: 'No-cost EMI',
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
        <circle cx={12} cy={12} r={8.75} />
        <path strokeLinecap="round" d="M9 14.5l6-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 11.25l2.75-1m-1 4.5l3-1.25" />
      </svg>
    ),
  },
]

/** Hairline separators — rhythm matches marquee wrap so strip reads as continuous. */
function Spine() {
  return <span className="mx-8 h-12 w-px shrink-0 bg-white/22 sm:mx-10 sm:h-14" aria-hidden />
}

function TrustChip({ def }: { def: TrustDef }) {
  const { title, Icon } = def
  return (
    <div className="flex shrink-0 items-center gap-4 whitespace-nowrap text-neutral-50 sm:gap-5">
      <Icon className="h-12 w-12 shrink-0 text-neutral-400 sm:h-14 sm:w-14" />
      <span className="text-2xl font-semibold uppercase tracking-[0.14em] sm:text-3xl">{title}</span>
    </div>
  )
}

/** Every chip prefixed with spine → two copies concatenate with identical width halves for -50% loop. */
function TrustSegment({ suffix }: { suffix: string }) {
  return (
    <>
      {TRUST_POINTS.map((def, i) => (
        <Fragment key={`${suffix}-${def.title}-${i}`}>
          <Spine />
          <TrustChip def={def} />
        </Fragment>
      ))}
    </>
  )
}

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

export function HomeTrustBannerMarquee() {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    return (
      <section className="w-full border-y border-white/[0.11] bg-neutral-950/90 py-6 sm:py-7" aria-labelledby="trust-strip-h">
        <h2 id="trust-strip-h" className="sr-only">
          Trust and guarantees
        </h2>
        <div className="container-page flex flex-wrap items-center justify-center gap-x-0 gap-y-5">
          {TRUST_POINTS.map((def, i) => (
            <Fragment key={def.title}>
              {i > 0 ? <Spine /> : null}
              <TrustChip def={def} />
            </Fragment>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="group w-full overflow-hidden border-y border-white/[0.11] bg-black py-0" aria-labelledby="trust-marquee-h">
      <h2 id="trust-marquee-h" className="sr-only">
        Trust and guarantees
      </h2>
      <div className="bg-neutral-950/90 py-[1.375rem] sm:py-6">
        <div className="animate-home-trust-banner-marquee flex w-max flex-nowrap items-center py-2 will-change-transform group-hover:[animation-play-state:paused] sm:py-2.5">
          <div className="flex shrink-0 items-center">
            <TrustSegment suffix="m1" />
          </div>
          <div className="flex shrink-0 items-center" aria-hidden>
            <TrustSegment suffix="m2" />
          </div>
        </div>
      </div>
    </section>
  )
}
