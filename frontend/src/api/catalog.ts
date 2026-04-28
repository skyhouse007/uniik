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

export async function fetchCategories() {
  const res = await api.get<{ items: Category[] }>('/categories')
  return res.data.items
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
