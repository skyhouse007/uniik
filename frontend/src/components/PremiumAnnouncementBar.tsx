import { useEffect, useMemo, useState, type SVGProps } from 'react'

const ANNOUNCEMENT_BAR_BG = '/images/announcement-bar-bg.png'

type IconName = 'leaf' | 'moon' | 'truck' | 'wind' | 'shield' | 'signature'

export type PremiumAnnouncementLine = {
  text: string
  icon: IconName
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

function inferIcon(text: string): IconName {
  const t = text.toLowerCase()
  if (t.includes('pure latex') && t.includes('pure sleep') && t.includes('pure nature')) return 'signature'
  if (t.includes('warranty') || /\d+\s*[-–]?\s*year\b/i.test(text)) return 'shield'
  if (t.includes('deliver') || t.includes('shipping') || t.includes('india')) return 'truck'
  if (t.includes('breath') || t.includes('organic material')) return 'wind'
  if (t.includes('sleep') || t.includes('comfort') || t.includes('rest')) return 'moon'
  if (t.includes('latex') || t.includes('natural') || t.includes('nature')) return 'leaf'
  return 'signature'
}

function linesFromStrings(raw: string[]): PremiumAnnouncementLine[] {
  return raw.map((text) => ({ text: String(text ?? '').trim(), icon: inferIcon(text) })).filter((x) => x.text)
}

function IconLeaf(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 3c-4.5 3-7 7.5-7 12a7 7 0 0 0 14 0c0-4.5-2.5-9-7-12z" />
      <path d="M12 9v9" />
    </svg>
  )
}

function IconMoon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
    </svg>
  )
}

function IconTruck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4v14" />
      <path d="M14 9h4l3 3v6h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  )
}

function IconWind(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 10h6a2 2 0 1 0 0-4" />
      <path d="M3 14h12a2 2 0 1 1 0 4" />
      <path d="M6 18h9" />
    </svg>
  )
}

function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 3 4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7l-8-4z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  )
}

function IconSignature(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 17c2-6 8-13 13-13 2 0 3 1 3 3 0 4-9 11-13 13H4z" />
      <path d="M11 17h7" />
    </svg>
  )
}

function RowIcon({ name }: { name: IconName }) {
  const className = 'shrink-0 text-[#d4e4c8]'
  switch (name) {
    case 'moon':
      return <IconMoon className={className} />
    case 'truck':
      return <IconTruck className={className} />
    case 'wind':
      return <IconWind className={className} />
    case 'shield':
      return <IconShield className={className} />
    case 'signature':
      return <IconSignature className={className} />
    default:
      return <IconLeaf className={className} />
  }
}

function MarqueeItem({ line }: { line: PremiumAnnouncementLine }) {
  return (
    <span className="inline-flex items-center gap-4 whitespace-nowrap">
      <RowIcon name={line.icon} />
      <span className="text-[11px] font-normal uppercase leading-none tracking-[0.36em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.82),0_0_1px_rgba(0,0,0,0.9)] sm:text-xs sm:tracking-[0.38em]">{line.text}</span>
    </span>
  )
}

function MarqueeTrack({ lines, id, hideFromA11y }: { lines: PremiumAnnouncementLine[]; id: string; hideFromA11y?: boolean }) {
  return (
    <div
      className="relative isolate z-[1] flex min-h-[3.75rem] w-max shrink-0 items-center gap-16 py-4 pr-16 sm:min-h-[4.25rem] sm:gap-20 sm:py-5 sm:pr-20 lg:gap-28 lg:pr-28"
      aria-hidden={hideFromA11y ? true : undefined}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-neutral-950 bg-cover bg-no-repeat [transform:translateZ(0)]"
        style={{
          backgroundImage: `url(${ANNOUNCEMENT_BAR_BG})`,
          backgroundPosition: 'center 42%',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/25" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" aria-hidden />
      {lines.map((line, i) => (
        <span key={`${id}-${line.text}-${i}`} className="relative z-[1] inline-flex">
          <MarqueeItem line={line} />
        </span>
      ))}
    </div>
  )
}

export function PremiumAnnouncementBar({ announcements }: { announcements: string[] }) {
  const reducedMotion = usePrefersReducedMotion()
  const lines = useMemo(() => {
    const parsed = linesFromStrings(announcements)
    return parsed.length ? parsed : linesFromStrings(['Pure sleep — crafted for calm nights'])
  }, [announcements])

  const joinedLabel = lines.map((l) => l.text).join('. ')

  if (reducedMotion) {
    return (
      <div
        className="font-ui relative overflow-hidden border-b border-white/10 bg-neutral-950"
        role="region"
        aria-label="Announcements"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black to-transparent sm:w-16" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black to-transparent sm:w-16" aria-hidden />
        <div className="relative overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative flex min-h-[3.75rem] min-w-max items-center justify-center gap-12 px-6 py-4 sm:min-h-[4.25rem] sm:gap-16 sm:py-5 lg:gap-20">
            <div
              className="pointer-events-none absolute inset-0 z-0 bg-neutral-950 bg-cover bg-no-repeat [transform:translateZ(0)]"
              style={{
                backgroundImage: `url(${ANNOUNCEMENT_BAR_BG})`,
                backgroundPosition: 'center 42%',
              }}
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 z-0 bg-black/25" aria-hidden />
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-white/[0.04] via-transparent to-white/[0.04]" aria-hidden />
            {lines.map((line, i) => (
              <span key={`static-${line.text}-${i}`} className="relative z-[1] inline-flex">
                <MarqueeItem line={line} />
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group font-ui relative overflow-hidden border-b border-white/10 bg-neutral-950"
      role="region"
      aria-label={`Announcements: ${joinedLabel}`}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black to-transparent sm:w-16" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black to-transparent sm:w-16" aria-hidden />

      <div className="relative overflow-hidden">
        <div className="animate-premium-announcement-marquee relative flex w-max flex-nowrap will-change-transform group-hover:[animation-play-state:paused]">
          <MarqueeTrack id="a" lines={lines} />
          <MarqueeTrack id="b" lines={lines} hideFromA11y />
        </div>
      </div>
    </div>
  )
}
