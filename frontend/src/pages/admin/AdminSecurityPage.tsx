import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { clearAdminToken } from '../../utils/adminAuth'

export function AdminSecurityPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState('')

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>Admin Security — CozyFoam</title>
        <meta name="description" content="Manage admin security and passkey settings." />
      </Helmet>

      <div className="mb-6">
        <div className="text-xl font-extrabold tracking-tight">Admin security</div>
        <div className="mt-1 text-sm text-[rgb(var(--muted))]">
          Manage admin session and rotate passkey in your backend env credentials.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold">Rotate passkey</div>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            This project currently stores admin credentials in <code>backend/.env</code>. Update
            <code> ADMIN_PASSWORD</code> there, then restart backend.
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current passkey"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="New passkey"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            />
            <button
              onClick={() =>
                setMsg('Update ADMIN_PASSWORD in backend/.env to the new value and restart the backend server.')
              }
              className="rounded-xl bg-[rgb(var(--brand))] px-4 py-2 text-sm font-semibold text-white"
            >
              Save passkey instructions
            </button>
            {msg ? <div className="text-xs text-[rgb(var(--muted))]">{msg}</div> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold">Session</div>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Logout clears admin token from browser storage.
          </p>
          <button
            onClick={() => {
              clearAdminToken()
              window.location.href = '/admin/login'
            }}
            className="mt-4 rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
          >
            Logout admin
          </button>
        </div>
      </div>
    </div>
  )
}

