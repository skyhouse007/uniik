import { Link } from 'react-router-dom'
import type { Category } from '../types/catalog'

type Props = {
  category: Category
  /** When true, opens subcategory grid under this parent instead of product listing. */
  hasChildren?: boolean
  /** Top-level tiles (home / categories index): always open `/categories/:id` first. */
  preferHub?: boolean
  /** Full path override (e.g. home fallback tiles: `/products`, `/categories`). */
  linkTo?: string
}

export function CategoryCard({ category, hasChildren, preferHub, linkTo }: Props) {
  const to =
    linkTo ??
    (preferHub || hasChildren
      ? `/categories/${category._id}`
      : `/products?category=${encodeURIComponent(category._id)}`)

  const subline =
    hasChildren === true ? 'Subcategories & products' : 'Browse products in this collection'

  return (
    <div className="group flex h-full flex-col rounded-3xl border border-white/12 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl">
      <Link to={to} className="block flex-1">
        <div className="aspect-[4/3] rounded-xl border border-white/10 bg-black/50 p-3">
          <div className="grid h-full w-full place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-900 to-black">
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full w-full place-items-center px-3 text-center text-sm text-[rgb(var(--muted))]">
                {category.name}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="line-clamp-2 text-2xl font-bold tracking-tight text-[rgb(var(--fg))]">{category.name}</div>
          <div className="mt-1 text-xs text-[rgb(var(--muted))]">{subline}</div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Shop this range</div>
          <div className="mt-1 text-xs text-[rgb(var(--muted))]">Tap to open collection</div>
        </div>
      </Link>
    </div>
  )
}
