import { Link, Outlet, useLocation } from 'react-router-dom'

const items = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/security', label: 'Security' },
]

export function AdminShell() {
  const loc = useLocation()
  return (
    <div className="container-page py-8">
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-gradient-to-r from-white to-[rgb(var(--surface))] p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wide text-[rgb(var(--brand))]">Admin Workspace</div>
            <div className="mt-1 text-xl font-extrabold tracking-tight">Admin</div>
            <div className="mt-1 text-sm text-[rgb(var(--muted))]">Manage catalog, orders and content from one place</div>
          </div>
          <Link to="/products" className="rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-semibold text-[rgb(var(--brand))]">
            View storefront
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
          {items.map((it) => {
            const active = loc.pathname === it.to
            return (
              <Link
                key={it.to}
                to={it.to}
                className={[
                  'rounded-xl px-4 py-2 text-sm font-semibold transition',
                  active
                    ? 'bg-white text-[rgb(var(--brand))] shadow-sm'
                    : 'text-[rgb(var(--muted))] hover:bg-white hover:text-[rgb(var(--brand))]',
                ].join(' ')}
              >
                {it.label}
              </Link>
            )
          })}
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

