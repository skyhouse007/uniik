import { api } from './client'
import type { Category, Product } from '../types/catalog'

export type ProductQuery = {
  page?: number
  limit?: number
  sort?: string
  q?: string
  category?: string
  brand?: string
  size?: string
  firmness?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
}

export type DeliveryCheckResult =
  | { ok: true; deliveryDays: number; deliveryDate: string; message: string }
  | { ok: false; message?: string; error?: string }

function normalizeMongoId(id: unknown): string | null {
  if (id == null || id === '') return null
  if (typeof id === 'string') return id
  if (typeof id === 'object' && id !== null && '$oid' in (id as Record<string, unknown>)) {
    return String((id as { $oid: string }).$oid)
  }
  return String(id)
}

/** Normalize category payloads so root detection (parentId) and keys work across APIs. */
export function normalizeCategories(items: unknown[]): Category[] {
  if (!Array.isArray(items)) return []
  return items.map((raw: unknown) => {
    const c = raw as Record<string, unknown>
    return {
      _id: normalizeMongoId(c._id) ?? String(c._id ?? ''),
      name: String(c.name ?? 'Untitled'),
      image: c.image != null ? String(c.image) : undefined,
      parentId: normalizeMongoId(c.parentId),
      sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : undefined,
    }
  })
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<{ items?: Category[] } | Category[]>('/categories', {
    /** Same pattern as `adminClient`: Express ETags + 304 can leave Axios with empty `data`. */
    params: { _cb: Date.now() },
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  })
  const raw = Array.isArray(res.data) ? res.data : res.data?.items
  return normalizeCategories(raw ?? [])
}

export async function fetchProducts(query: ProductQuery) {
  const res = await api.get<{ items: Product[]; page: number; limit: number; total: number }>(
    '/products',
    { params: query },
  )
  return res.data
}

export async function fetchProduct(id: string) {
  const res = await api.get<Product>(`/products/${id}`)
  return res.data
}

export async function checkProductDelivery(productId: string, pincode: string) {
  const res = await api.get<DeliveryCheckResult>(`/products/${productId}/check-delivery`, {
    params: { pincode },
  })
  return res.data
}

export async function searchProducts(q: string) {
  const res = await api.get<{ items: Product[] }>('/search', { params: { q } })
  return res.data.items
}
