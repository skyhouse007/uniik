import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  return (
    <div>
      <Helmet>
        <title>Admin — Uniik</title>
        <meta name="description" content="Admin dashboard for managing products, categories, orders, and inventory." />
      </Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold tracking-tight text-white">Admin dashboard</div>
          <div className="mt-1 text-sm text-white/60">Products • Categories • Orders • Content</div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/security" className="text-xs font-semibold text-white underline-offset-4 hover:text-white/85 hover:underline">
            Security & passkeys
          </Link>
          <Link to="/products" className="text-xs font-semibold text-white underline-offset-4 hover:text-white/85 hover:underline">
            View storefront
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Link
          to="/admin/products"
          className="admin-card-soft group p-6 shadow-sm transition hover:border-white/20 hover:bg-black/70 hover:shadow-md lg:p-6"
        >
          <div className="text-sm font-semibold text-white">Products</div>
          <div className="mt-2 text-sm text-white/60 group-hover:text-white/75">Create, update, delete products.</div>
        </Link>
        <Link
          to="/admin/categories"
          className="admin-card-soft group p-6 shadow-sm transition hover:border-white/20 hover:bg-black/70 hover:shadow-md lg:p-6"
        >
          <div className="text-sm font-semibold text-white">Categories</div>
          <div className="mt-2 text-sm text-white/60 group-hover:text-white/75">Create, update, delete categories.</div>
        </Link>
        <Link
          to="/admin/orders"
          className="admin-card-soft group p-6 shadow-sm transition hover:border-white/20 hover:bg-black/70 hover:shadow-md lg:p-6"
        >
          <div className="text-sm font-semibold text-white">Orders</div>
          <div className="mt-2 text-sm text-white/60 group-hover:text-white/75">See all orders and update statuses.</div>
        </Link>
      </div>

      <div className="mt-6 rounded-3xl border border-white/12 bg-neutral-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="text-sm font-semibold text-white">Admin setup</div>
        <div className="mt-2 text-sm text-white/65">
          Admin auth is independent from Clerk. Configure <code className="rounded bg-black/60 px-1.5 py-0.5 text-white/90">ADMIN_EMAIL</code>,{' '}
          <code className="rounded bg-black/60 px-1.5 py-0.5 text-white/90">ADMIN_PASSWORD</code>, and{' '}
          <code className="rounded bg-black/60 px-1.5 py-0.5 text-white/90">ADMIN_JWT_SECRET</code> in backend env.
        </div>
        <div className="mt-2 text-sm text-white/65">
          To manage login passkeys, open{' '}
          <code className="rounded bg-black/60 px-1.5 py-0.5 text-white/90">/admin/security</code>.
        </div>
      </div>
    </div>
  )
}
