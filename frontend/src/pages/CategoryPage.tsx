import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { fetchCategories } from '../api/catalog'
import type { Category } from '../types/catalog'
import { CategoryCard } from '../components/CategoryCard'
import { Skeleton } from '../components/Skeleton'

function categoryHasChildren(all: Category[], catId: string) {
  return all.some((c) => c.parentId === catId)
}

function sortCategories(a: Category, b: Category) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
}

export function CategoryPage() {
  const { parentId } = useParams<{ parentId?: string }>()
  const [all, setAll] = useState<Category[] | null>(null)

  useEffect(() => {
    let alive = true
    fetchCategories()
      .then((c) => alive && setAll(c))
      .catch(() => alive && setAll([]))
    return () => {
      alive = false
    }
  }, [])

  const parent = useMemo(() => {
    if (!parentId || !all) return null
    return all.find((c) => c._id === parentId) ?? null
  }, [parentId, all])

  const displayCategories = useMemo(() => {
    if (!all) return null
    if (parentId) {
      return all.filter((c) => c.parentId === parentId).sort(sortCategories)
    }
    const roots = all.filter((c) => !c.parentId)
    return (roots.length ? roots : all).slice().sort(sortCategories)
  }, [all, parentId])

  const title = parent ? parent.name : 'Mattress categories'
  const description = parent
    ? `Types under ${parent.name}`
    : 'Top-level collections — open one to see subcategories when available.'

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>{parent ? `${parent.name} — Categories — CozyFoam` : 'Categories — CozyFoam'}</title>
        <meta name="description" content="Browse mattress categories by comfort, build and materials." />
      </Helmet>

      <nav className="text-xs text-[rgb(var(--muted))]">
        <Link to="/categories" className="font-semibold text-[rgb(var(--brand))] hover:underline">
          Mattress categories
        </Link>
        {parent ? (
          <>
            <span className="mx-1.5 text-[rgb(var(--border))]">/</span>
            <span className="text-[rgb(var(--fg))]">{parent.name}</span>
          </>
        ) : null}
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">{description}</div>
        </div>
        {parentId ? (
          <Link
            to={`/products?category=${encodeURIComponent(parentId)}`}
            className="rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] shadow-sm hover:border-[rgb(var(--brand))]"
          >
            Shop all in {parent?.name ?? 'this category'}
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
        {displayCategories === null ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="min-h-[22rem] rounded-3xl sm:min-h-[24rem]" />
          ))
        ) : parentId && !parent ? (
          <div className="col-span-full text-sm text-[rgb(var(--muted))]">
            This category was not found.{' '}
            <Link to="/categories" className="font-semibold text-[rgb(var(--brand))]">
              Back to categories
            </Link>
          </div>
        ) : displayCategories.length ? (
          displayCategories.map((c) => (
            <CategoryCard
              key={c._id}
              category={c}
              preferHub={!parentId}
              hasChildren={categoryHasChildren(all ?? [], c._id)}
            />
          ))
        ) : parentId && parent ? (
          <div className="col-span-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-sm text-[rgb(var(--muted))]">
            No subcategories here yet.{' '}
            <Link
              to={`/products?category=${encodeURIComponent(parentId)}`}
              className="font-semibold text-[rgb(var(--brand))]"
            >
              Browse products in {parent.name}
            </Link>
          </div>
        ) : (
          <div className="text-sm text-[rgb(var(--muted))]">No categories found.</div>
        )}
      </div>
    </div>
  )
}

