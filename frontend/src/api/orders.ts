import { authedGet } from './authed'

export type OrderItem = {
  productId: string
  name: string
  image?: string
  unitPrice: number
  quantity: number
  selectedVariantCategory?: string
  selectedSize?: string
  selectedThickness?: string
  size?: string
}

export type Order = {
  _id: string
  userId: string
  products: OrderItem[]
  totalAmount: number
  paymentStatus: 'paid' | 'failed' | 'pending'
  orderStatus: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  address: any
  createdAt: string
  updatedAt?: string
}

export async function fetchMyOrders(token: string) {
  return await authedGet<{ items: Order[] }>('/orders', token)
}

