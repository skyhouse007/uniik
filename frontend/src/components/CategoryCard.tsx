import { Link } from 'react-router-dom'
import type { Category } from '../types/catalog'

type Props = {
  category: Category
  /** When true, opens subcategory grid under this parent instead of product listing. */
  hasChildren?: boolean
  /** Top-level tiles (home / categories index): always open `/categories/:id` first. */
  preferHub?: boolean
}

export function CategoryCard({ category, hasChildren, preferHub }: Props) {
  const to =
    preferHub || hasChildren
      ? `/categories/${category._id}`
      : `/products?category=${encodeURIComponent(category._id)}`
  const cta = hasChildren ? 'View subcategories' : 'Shop now'

  return (
    <Link
      to={to}
      className="group grid h-full grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <div className="relative min-h-[140px] overflow-hidden bg-slate-100 sm:min-h-[180px]">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm font-medium text-slate-600">
            {category.name}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between bg-white p-3 sm:p-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Category</div>
          <div className="mt-1 line-clamp-2 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {category.name}
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] text-slate-600 sm:text-xs">
            {hasChildren
              ? 'Discover premium collections and explore deeper options by comfort type.'
              : 'Browse complete products in this category with modern filtering and quick checkout.'}
          </p>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-2.5 sm:mt-4 sm:pt-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-all duration-300 group-hover:gap-2 group-hover:text-blue-700 sm:text-sm">
            {cta} →
          </span>
          <div className="mt-1 hidden text-[11px] font-semibold text-slate-500 sm:block">
            Curated for comfort-first shopping
          </div>
        </div>
      </div>
    </Link>
  )
}
