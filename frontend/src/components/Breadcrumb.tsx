import { Link } from 'react-router-dom'

export type Crumb = { label: string; to?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="text-xs text-[rgb(var(--muted))]">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {c.to ? (
              <Link className="hover:text-[rgb(var(--brand))]" to={c.to}>
                {c.label}
              </Link>
            ) : (
              <span className="text-[rgb(var(--fg))]">{c.label}</span>
            )}
            {idx < items.length - 1 ? <span>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}

