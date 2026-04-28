import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { createBulkInquiry } from '../api/site'

export function BulkOrderPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  async function submit() {
    setSaving(true)
    setStatus('')
    try {
      await createBulkInquiry({ name, phone, email, message })
      setStatus('Your bulk order request has been submitted.')
      setName('')
      setPhone('')
      setEmail('')
      setMessage('')
    } catch (e: any) {
      setStatus(e?.response?.data?.error ?? 'Failed to submit request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Bulk Order - CozyFoam</title>
      </Helmet>
      <div className="text-xl font-extrabold tracking-tight">Bulk order enquiry</div>
      <div className="mt-1 text-sm text-[rgb(var(--muted))]">Share your requirements and our team will contact you.</div>

      <div className="mt-6 max-w-2xl rounded-3xl border border-[rgb(var(--border))] bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Order quantity, product type, city, delivery timeline..."
            rows={5}
            className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          {status ? <div className="text-sm text-[rgb(var(--muted))]">{status}</div> : null}
          <button
            onClick={submit}
            disabled={saving || name.trim().length < 2 || phone.trim().length < 6 || message.trim().length < 5}
            className="rounded-xl bg-[rgb(var(--brand))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit enquiry'}
          </button>
        </div>
      </div>
    </div>
  )
}
