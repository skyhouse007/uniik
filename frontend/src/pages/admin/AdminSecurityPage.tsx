import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { clearAdminToken } from '../../utils/adminAuth'

export function AdminSecurityPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState('')

  return (
    <div>
      <Helmet>
        <title>Admin Security — Uniik</title>
        <meta name="description" content="Manage admin security and passkey settings." />
      </Helmet>

      <div className="mb-6">
        <div className="text-xl font-extrabold tracking-tight text-white">Admin security</div>
        <div className="mt-1 text-sm text-white/60">Manage admin session and rotate passkey in your backend env credentials.</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card">
          <div className="text-sm font-semibold text-white">Rotate passkey</div>
          <p className="mt-2 text-xs text-white/60">
            This project currently stores admin credentials in <code className="rounded bg-black/50 px-1 text-white/85">backend/.env</code>. Update
            <code className="rounded bg-black/50 px-1 text-white/85"> ADMIN_PASSWORD</code> there, then restart backend.
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current passkey"
              className="admin-field w-full"
            />
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="New passkey"
              className="admin-field w-full"
            />
            <button
              type="button"
              onClick={() =>
                setMsg('Update ADMIN_PASSWORD in backend/.env to the new value and restart the backend server.')
              }
              className="admin-btn-solid w-full sm:w-auto"
            >
              Save passkey instructions
            </button>
            {msg ? <div className="text-xs text-white/55">{msg}</div> : null}
          </div>
        </div>

        <div className="admin-card">
          <div className="text-sm font-semibold text-white">Session</div>
          <p className="mt-2 text-xs text-white/60">Logout clears admin token from browser storage.</p>
          <button
            type="button"
            onClick={() => {
              clearAdminToken()
              window.location.href = '/admin/login'
            }}
            className="admin-btn-outline mt-4"
          >
            Logout admin
          </button>
        </div>
      </div>
    </div>
  )
}
