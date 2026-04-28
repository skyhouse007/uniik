import { api } from './client'

export type SiteSettings = {
  /** Rotating bar lines (one after another). */
  announcements?: string[]
  /** First line; legacy single-field API. */
  announcementText?: string
  contactEmail: string
}

export type TrackOrderResult = {
  _id: string
  orderStatus: string
  paymentStatus: string
  createdAt: string
  totalAmount: number
  items: Array<{ name: string; quantity: number }>
}

export async function fetchSiteSettings() {
  const res = await api.get<SiteSettings>('/site/settings', {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  return res.data
}

export async function createBulkInquiry(payload: {
  name: string
  phone: string
  email?: string
  message: string
}) {
  const res = await api.post<{ ok: true; id: string }>('/site/bulk-inquiries', payload)
  return res.data
}

export async function trackOrder(payload: { orderId: string; phone: string }) {
  const res = await api.post<TrackOrderResult>('/site/orders/track', payload)
  return res.data
}
