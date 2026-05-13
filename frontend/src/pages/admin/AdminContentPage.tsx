import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { adminGet, adminPut } from '../../api/adminClient'

type Settings = {
  announcements?: string[]
  announcementText?: string
  contactEmail: string
}

type Inquiry = {
  _id: string
  name: string
  phone: string
  email?: string
  message: string
  status: 'new' | 'contacted' | 'closed'
  createdAt: string
}

function linesFromSettings(s: Settings): string[] {
  const fromList = (s.announcements ?? []).map((x) => String(x).trim()).filter(Boolean)
  if (fromList.length) return fromList
  const legacy = s.announcementText?.trim()
  return legacy ? [legacy] : []
}

const MAX_ANNOUNCEMENTS = 12
const MAX_ANNOUNCEMENT_LEN = 220

export function AdminContentPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [headerForm, setHeaderForm] = useState({
    announcementLines: [''] as string[],
    contactEmail: '',
  })
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const loadSeq = useRef(0)

  async function load() {
    setError('')
    const seq = ++loadSeq.current
    const [s, iq] = await Promise.all([
      adminGet<Settings>('/admin/content/settings'),
      adminGet<{ items: Inquiry[] }>('/admin/content/bulk-inquiries'),
    ])
    if (seq !== loadSeq.current) return
    setSettings(s)
    const loaded = linesFromSettings(s)
    setHeaderForm({
      announcementLines: loaded.length ? loaded : [''],
      contactEmail: s.contactEmail ?? '',
    })
    setInquiries(iq.items)
  }

  useEffect(() => {
    load().catch((e: any) => setError(e?.response?.data?.error ?? 'Failed to load content settings'))
  }, [])

  async function saveSettings() {
    setSaving(true)
    setError('')
    try {
      const announcements = headerForm.announcementLines.map((l) => l.trim()).filter(Boolean)
      const email = headerForm.contactEmail.trim()
      const updated = await adminPut<Settings>('/admin/content/settings', {
        announcements,
        ...(email ? { contactEmail: email } : {}),
      })
      setSettings(updated)
      const nextLines = linesFromSettings(updated)
      setHeaderForm({
        announcementLines: nextLines.length ? nextLines : [''],
        contactEmail: updated.contactEmail ?? '',
      })
    } catch (e: any) {
      const issues = e?.response?.data?.issues
      const first =
        Array.isArray(issues) && issues[0] ? String(issues[0].message ?? issues[0]) : ''
      setError(first || e?.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Helmet>
        <title>Admin Content — Uniik</title>
      </Helmet>

      <div>
        <div className="text-lg font-extrabold text-white">Content</div>
        <div className="mt-1 text-sm text-white/60">Announcements, contact email, bulk order messages</div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="admin-card">
          <div className="text-sm font-semibold text-white">Header settings</div>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-white/80">Announcements</div>
              <p className="text-xs text-white/55">
                Each box is one message. The storefront rotates them automatically every few seconds. Empty boxes are ignored on save.
              </p>
              <ul className="mt-2 list-none space-y-2 p-0">
                {headerForm.announcementLines.map((line, index) => (
                  <li key={index} className="flex gap-2">
                    <span
                      className="mt-2.5 w-7 shrink-0 text-right text-[11px] font-medium tabular-nums text-white/45"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <label className="sr-only" htmlFor={`announcement-${index}`}>
                        Announcement {index + 1}
                      </label>
                      <input
                        id={`announcement-${index}`}
                        type="text"
                        value={line}
                        maxLength={MAX_ANNOUNCEMENT_LEN}
                        onChange={(e) => {
                          const v = e.target.value
                          setHeaderForm((f) => ({
                            ...f,
                            announcementLines: f.announcementLines.map((l, i) => (i === index ? v : l)),
                          }))
                        }}
                        placeholder={
                          index === 0
                            ? 'e.g. Free shipping on prepaid orders above ₹999'
                            : 'Next message…'
                        }
                        className="admin-field w-full"
                      />
                      <div className="mt-0.5 text-right text-[10px] text-white/45">
                        {line.length}/{MAX_ANNOUNCEMENT_LEN}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={headerForm.announcementLines.length <= 1}
                      onClick={() =>
                        setHeaderForm((f) => {
                          const next = f.announcementLines.filter((_, i) => i !== index)
                          return { ...f, announcementLines: next.length ? next : [''] }
                        })
                      }
                      className="mt-1 shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-400 transition hover:bg-red-950/50 disabled:pointer-events-none disabled:opacity-30"
                      title="Remove this announcement"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={headerForm.announcementLines.length >= MAX_ANNOUNCEMENTS}
                onClick={() =>
                  setHeaderForm((f) =>
                    f.announcementLines.length >= MAX_ANNOUNCEMENTS
                      ? f
                      : { ...f, announcementLines: [...f.announcementLines, ''] },
                  )
                }
                className="w-full rounded-xl border border-dashed border-white/25 py-2 text-xs font-semibold text-white/65 transition hover:border-white/40 hover:text-white disabled:opacity-40"
              >
                + Add another announcement ({headerForm.announcementLines.length}/{MAX_ANNOUNCEMENTS})
              </button>
            </div>
            <input
              value={headerForm.contactEmail}
              onChange={(e) => setHeaderForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder="Contact email"
              className="admin-field w-full"
            />
            {error ? <div className="text-xs text-red-400">{error}</div> : null}
            <button disabled={saving} onClick={saveSettings} className="admin-btn-solid w-full disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {settings ? (
            <div className="mt-3 text-xs text-white/55">Current contact: {settings.contactEmail}</div>
          ) : null}
        </div>

        <div className="admin-card">
          <div className="text-sm font-semibold text-white">Bulk order messages</div>
          <div className="mt-4 grid gap-2">
            {inquiries === null ? (
              <div className="text-sm text-white/55">Loading...</div>
            ) : inquiries.length ? (
              inquiries.map((i) => (
                <div key={i._id} className="rounded-2xl border border-white/12 bg-black/40 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{i.name}</div>
                      <div className="text-xs text-white/55">
                        {i.phone} {i.email ? `• ${i.email}` : ''}
                      </div>
                    </div>
                    <select
                      value={i.status}
                      onChange={async (e) => {
                        await adminPut(`/admin/content/bulk-inquiries/${i._id}`, { status: e.target.value })
                        await load()
                      }}
                      className="rounded-xl border border-white/20 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-white/45"
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                  <div className="mt-2 text-sm text-white/75">{i.message}</div>
                  <div className="mt-1 text-xs text-white/45">{new Date(i.createdAt).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/55">No bulk order messages yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
