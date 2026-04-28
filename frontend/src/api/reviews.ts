import { api } from './client'
import type { Review } from '../types/catalog'

export async function fetchReviews(productId: string) {
  const res = await api.get<{ items: Review[] }>(`/products/${productId}/reviews`)
  return res.data.items
}

