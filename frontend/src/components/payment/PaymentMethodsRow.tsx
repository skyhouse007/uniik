import type React from 'react'

type Props = {
  compact?: boolean
}

function IconCard() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3.5 7.5h17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-17a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
      <path d="M2 11h20" />
      <path d="M6 16h5" />
    </svg>
  )
}

function IconUPI() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 7h16" />
      <path d="M7 7v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" />
      <path d="M9 12h6" />
    </svg>
  )
}

function IconEMI() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 2v20" />
      <path d="M6 6h8a4 4 0 0 1 0 8H8" />
      <path d="M6 18h12" />
    </svg>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[rgb(var(--fg))] shadow-sm">
      {children}
    </span>
  )
}

export function PaymentMethodsRow({ compact }: Props) {
  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'mt-2 flex flex-wrap gap-2'}>
      <Pill>
        <IconCard /> Credit Card
      </Pill>
      <Pill>
        <IconCard /> Debit Card
      </Pill>
      <Pill>
        <IconUPI /> UPI
      </Pill>
      <Pill>
        <IconEMI /> EMI
      </Pill>
    </div>
  )
}

