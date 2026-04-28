import { Router } from 'express'
import { z } from 'zod'
import { requireAdminToken } from '../middleware/adminAuth.js'
import { SiteSettings } from '../models/SiteSettings.js'
import { BulkInquiry } from '../models/BulkInquiry.js'

export const adminContentRouter = Router()
adminContentRouter.use(requireAdminToken)

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
  let doc = await SiteSettings.findOne().sort({ _id: 1 })
  if (!doc) doc = await SiteSettings.create({})
  return doc
}

function noStoreJson(res, payload) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.json(payload)
}

adminContentRouter.get('/settings', async (req, res, next) => {
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

const SettingsSchema = z.object({
  announcementText: z.string().max(500).optional(),
  announcements: z.array(z.string().max(220)).max(12).optional(),
  /**
   * Admin UI may send "", null, or omit. Never fail the whole save (and drop announcements)
   * because of contact email — coerce empty to undefined, then optional email.
   */
  contactEmail: z.preprocess((v) => {
    if (v === null || v === undefined) return undefined
    const t = String(v).trim()
    return t === '' ? undefined : t
  }, z.string().email().optional()),
})

adminContentRouter.put('/settings', async (req, res, next) => {
  try {
    const data = SettingsSchema.parse(req.body)
    const current = await getOrCreateSettings()
    if (typeof data.announcements !== 'undefined') {
      const lines = data.announcements.map((s) => s.trim()).filter(Boolean)
      current.announcementMessages = lines
      current.announcementText = lines[0] ?? ''
    } else if (typeof data.announcementText !== 'undefined') {
      current.announcementText = data.announcementText
      const t = data.announcementText.trim()
      current.announcementMessages = t ? [t] : []
    }
    if (typeof data.contactEmail === 'string' && data.contactEmail.trim()) {
      current.contactEmail = data.contactEmail.trim()
    }
    await current.save()
    const announcements = announcementsFromDoc(current)
    noStoreJson(res, {
      announcements,
      announcementText: announcements[0] ?? '',
      contactEmail: current.contactEmail,
    })
  } catch (e) {
    next(e)
  }
})

adminContentRouter.get('/bulk-inquiries', async (req, res, next) => {
  try {
    const items = await BulkInquiry.find({}).sort({ createdAt: -1 }).lean()
    res.json({ items })
  } catch (e) {
    next(e)
  }
})

const InquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']),
})

adminContentRouter.put('/bulk-inquiries/:id', async (req, res, next) => {
  try {
    const data = InquiryStatusSchema.parse(req.body)
    const updated = await BulkInquiry.findByIdAndUpdate(req.params.id, { status: data.status }, { new: true })
    if (!updated) return res.status(404).json({ error: 'Inquiry not found' })
    res.json(updated)
  } catch (e) {
    next(e)
  }
})
