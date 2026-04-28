import { useMemo, useState } from 'react'
import { BankLogosRow } from './BankLogosRow'
import { PaymentMethodsRow } from './PaymentMethodsRow'

type Props = {
  price: number
  variant?: 'product' | 'summary'
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 2l8 4v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4z" />
      <path d="M9.5 12l1.8 1.9L15.5 10" />
    </svg>
  )
}

export function PaymentTrustSection({ price, variant = 'product' }: Props) {
  const [expanded, setExpanded] = useState(false)

  const emiPerMonth = useMemo(() => {
    const p = Number(price ?? 0)
    if (!Number.isFinite(p) || p <= 0) return null
    return Math.floor(p / 12)
  }, [price])

  const cardPadding = variant === 'summary' ? 'p-4' : 'p-5'

  return (
    <section className={`font-ui rounded-xl border border-[rgb(var(--border))] bg-white ${cardPadding} shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-header text-base font-semibold tracking-tight text-[rgb(var(--fg))]">Payment Options</div>
          {emiPerMonth !== null ? (
            <div className="mt-1 text-sm text-[rgb(var(--fg))]">
              <span className="font-semibold">EMI starts at {formatMoney(emiPerMonth)}/month</span>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                EMI available on select cards • Available EMI plans are shown securely during checkout • Eligibility depends on bank/card
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-[rgb(var(--muted))]">
              EMI available on select cards • Available EMI plans are shown securely during checkout • Eligibility depends on bank/card
            </div>
          )}
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[rgb(var(--surface))] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--fg))]">
          <IconShield />
          Secure
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-black/10 bg-[rgb(var(--surface))] px-4 py-3">
        <div className="text-xs font-semibold text-[rgb(var(--fg))]">Secure payments powered by Razorpay</div>
        <div className="mt-1 text-xs text-[rgb(var(--muted))]">Your card and UPI details are processed securely in Razorpay checkout.</div>
      </div>

      <BankLogosRow className="mt-4" />

      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Payment methods</div>
        <PaymentMethodsRow />
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-3 text-sm font-semibold text-[rgb(var(--fg))] shadow-sm transition hover:border-[rgb(var(--muted))] hover:shadow"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide supported payment methods' : 'View supported payment methods'}
      </button>

      {expanded ? (
        <div className="mt-4 grid gap-2">
          {['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'EMI options'].map((m) => (
            <div key={m} className="rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-3 text-sm text-[rgb(var(--fg))]">
              <div className="font-semibold">{m}</div>
              <div className="mt-1 text-xs text-[rgb(var(--muted))]">Available inside Razorpay checkout based on eligibility.</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

