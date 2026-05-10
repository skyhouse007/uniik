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
      <div className="rounded-3xl border border-white/25 bg-black p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wide text-white/90">Admin Workspace</div>
            <div className="mt-1 text-xl font-extrabold tracking-tight text-white">Admin</div>
            <div className="mt-1 text-sm text-white/65">Manage catalog, orders and content from one place</div>
          </div>
          <Link
            to="/products"
            className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            View storefront
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/25 bg-black shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-white/15 bg-neutral-950 p-3">
          {items.map((it) => {
            const active = loc.pathname === it.to
            return (
              <Link
                key={it.to}
                to={it.to}
                className={[
                  'rounded-xl px-4 py-2 text-sm font-semibold transition',
                  active
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                {it.label}
              </Link>
            )
          })}
        </div>
        <div className="bg-black p-6 text-white">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

