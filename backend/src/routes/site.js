import { Router } from 'express'
import { z } from 'zod'
import { SiteSettings } from '../models/SiteSettings.js'
import { BulkInquiry } from '../models/BulkInquiry.js'
import { Order } from '../models/Order.js'

export const siteRouter = Router()

function announcementsFromDoc(doc) {
  const raw = doc.announcementMessages
  const arr = Array.isArray(raw)
    ? raw.map((s) => String(s ?? '').trim()).filter(Boolean)
    : []
  if (arr.length) return arr
  const legacy = String(doc.announcementText ?? '').trim()
  return legacy ? [legacy] : []
}

async function getOrCreateSettings() {
  /** Oldest doc first so reads/writes stay consistent if duplicates ever exist. */
  let doc = await SiteSettings.findOne().sort({ _id: 1 })
  if (!doc) doc = await SiteSettings.create({})
  return doc
}

function noStoreJson(res, payload) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.json(payload)
}

siteRouter.get('/settings', async (req, res, next) => {
  try {
    const doc = await getOrCreateSettings()
    const announcements = announcementsFromDoc(doc)
    noStoreJson(res, {
      announcements,
      announcementText: announcements[0] ?? '',
      contactEmail: doc.contactEmail ?? 'support@cozyfoam.in',
    })
  } catch (e) {
    next(e)
  }
})

const BulkSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(5),
})

siteRouter.post('/bulk-inquiries', async (req, res, next) => {
  try {
    const data = BulkSchema.parse(req.body)
    const created = await BulkInquiry.create({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      message: data.message,
    })
    res.status(201).json({ ok: true, id: created._id })
  } catch (e) {
    next(e)
  }
})

const TrackSchema = z.object({
  orderId: z.string().min(1),
  phone: z.string().min(3),
})

siteRouter.post('/orders/track', async (req, res, next) => {
  try {
    const { orderId, phone } = TrackSchema.parse(req.body)
    const normalized = phone.replace(/\D/g, '')
    const order = await Order.findById(orderId).lean()
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const orderPhone = String(order.address?.phone ?? '').replace(/\D/g, '')
    if (orderPhone && normalized && orderPhone !== normalized) {
      return res.status(403).json({ error: 'Phone does not match order' })
    }

    res.json({
      _id: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      items: (order.products ?? []).map((p) => ({
        name: p.name,
        quantity: p.quantity,
      })),
    })
  } catch (e) {
    next(e)
  }
})
