import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { adminLogin } from '../../api/admin'
import { setAdminToken } from '../../utils/adminAuth'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passkey, setPasskey] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLogin() {
    setBusy(true)
    setError('')
    try {
      const res = await adminLogin(email, password || passkey)
      setAdminToken(res.token)
      window.location.href = '/admin'
    } catch (e: any) {
      const status = e?.response?.status
      const dataErr = e?.response?.data?.error
      let msg = typeof dataErr === 'string' ? dataErr : ''
      if (!msg && e?.code === 'ERR_NETWORK') {
        msg =
          'Cannot reach the API. For local admin credentials from backend/.env, set VITE_API_BASE_URL=http://localhost:4000/api in frontend/.env and restart the dev server.'
      }
      if (!msg && status === 503) {
        msg = 'Server admin auth is not configured (set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_JWT_SECRET on the API host).'
      }
      setError(msg || e?.message || 'Login failed')
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-10">
      <Helmet>
        <title>Admin Login — CozyFoam</title>
        <meta name="description" content="Secure admin sign in with custom passkey/password auth." />
      </Helmet>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_430px] lg:items-center">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8">
          <div className="text-xs font-semibold text-[rgb(var(--brand))]">Admin Access</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Secure admin login</h1>
          <p className="mt-4 text-sm text-[rgb(var(--muted))]">
            Clerk is not used for admin authentication. Use admin credentials or your configured passkey value.
          </p>
        </div>
        <div className="rounded-3xl border border-white/25 bg-black p-6 text-white shadow-sm">
          <div className="text-sm font-semibold text-white">Login</div>
          <div className="mt-4 space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full rounded-xl border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/45"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/45"
            />
            <div className="text-center text-xs text-white/60">or</div>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Passkey"
              className="w-full rounded-xl border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/45"
            />
            {error ? <div className="text-xs text-red-400">{error}</div> : null}
            <button
              onClick={handleLogin}
              disabled={busy || !email || (!password && !passkey)}
              className="w-full rounded-xl bg-[rgb(var(--brand))] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign in to admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

