type Props = {
  className?: string
}

const banks = [
  { name: 'HDFC Bank', src: '/banks/hdfc.png' },
  { name: 'ICICI Bank', src: '/banks/icici.png' },
  { name: 'Axis Bank', src: '/banks/axis.png' },
] as const

export function BankLogosRow({ className }: Props) {
  return (
    <div className={className ?? ''}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Supported banks</div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {banks.map((b) => (
          <div
            key={b.name}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-neutral-100 px-3 py-2 shadow-sm"
          >
            <img src={b.src} alt={b.name} className="h-6 w-auto object-contain" loading="lazy" decoding="async" />
            <span className="text-xs font-semibold text-[rgb(var(--fg))]">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

