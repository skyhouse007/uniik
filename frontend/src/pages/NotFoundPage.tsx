import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export function NotFoundPage() {
  return (
    <div className="container-page py-16">
      <Helmet>
        <title>Not found — CozyFoam</title>
      </Helmet>
      <div className="mx-auto max-w-lg rounded-3xl border border-[rgb(var(--border))] bg-white p-8 text-center shadow-sm">
        <div className="text-2xl font-extrabold">404</div>
        <div className="mt-2 text-sm text-[rgb(var(--muted))]">This page doesn’t exist.</div>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-2xl bg-[rgb(var(--brand))] px-5 py-3 text-sm font-semibold text-white">
            Go home
          </Link>
          <Link to="/products" className="rounded-2xl border border-[rgb(var(--border))] bg-white px-5 py-3 text-sm font-semibold">
            Shop
          </Link>
        </div>
      </div>
    </div>
  )
}

