import { useState } from 'react'
import { checkProductDelivery } from '../../api/catalog'

type Props = {
  productId: string
}

export function DeliveryChecker({ productId }: Props) {
  const [pincode, setPincode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [ok, setOk] = useState<boolean | null>(null)

  async function check() {
    const p = pincode.replace(/\D/g, '')
    if (p.length !== 6) {
      setOk(false)
      setMessage('Enter a valid 6-digit pincode.')
      return
    }
    setLoading(true)
    setMessage(null)
    setOk(null)
    try {
      const res = await checkProductDelivery(productId, p)
      if (res.ok) {
        setOk(true)
        setMessage(res.message)
      } else {
        setOk(false)
        setMessage(res.message ?? 'Sorry, delivery is not available in your area.')
      }
    } catch {
      setOk(false)
      setMessage('Could not check delivery. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Delivery checker</div>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">Enter your pincode to see the estimated delivery date.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          placeholder="560001"
          maxLength={8}
          inputMode="numeric"
          className="min-w-[8rem] flex-1 rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
        />
        <button
          type="button"
          onClick={() => void check()}
          disabled={loading}
          className="rounded-xl bg-[rgb(var(--brand))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Check'}
        </button>
      </div>
      {message ? (
        <div
          className={[
            'mt-3 rounded-xl px-3 py-2 text-sm',
            ok ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800',
          ].join(' ')}
        >
          {message}
        </div>
      ) : null}
    </div>
  )
}
