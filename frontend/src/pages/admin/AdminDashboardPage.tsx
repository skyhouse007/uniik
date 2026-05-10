import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  return (
    <div>
      <Helmet>
        <title>Admin — CozyFoam</title>
        <meta name="description" content="Admin dashboard for managing products, categories, orders, and inventory." />
      </Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold tracking-tight">Admin dashboard</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">Products • Categories • Orders • Inventory</div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/security" className="text-xs font-semibold text-[rgb(var(--brand))]">
            Security & passkeys
          </Link>
          <Link to="/products" className="text-xs font-semibold text-[rgb(var(--brand))]">
            View storefront
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Link
          to="/admin/products"
          className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-sm font-semibold">Products</div>
          <div className="mt-2 text-sm text-neutral-600">Create, update, delete products.</div>
        </Link>
        <Link
          to="/admin/categories"
          className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-sm font-semibold">Categories</div>
          <div className="mt-2 text-sm text-neutral-600">Create, update, delete categories.</div>
        </Link>
        <Link
          to="/admin/orders"
          className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="text-sm font-semibold">Orders</div>
          <div className="mt-2 text-sm text-neutral-600">See all orders and update statuses.</div>
        </Link>
      </div>

      <div className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
        <div className="text-sm font-semibold">Admin setup</div>
        <div className="mt-2 text-sm text-[rgb(var(--muted))]">
          Admin auth is independent from Clerk. Configure <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code>,
          and <code>ADMIN_JWT_SECRET</code> in backend env.
        </div>
        <div className="mt-2 text-sm text-[rgb(var(--muted))]">
          To manage login passkeys, open <code>/admin/security</code>.
        </div>
      </div>
    </div>
  )
}

