import { Router } from 'express'
import { z } from 'zod'
import { requireAdminToken } from '../middleware/adminAuth.js'
import { Order } from '../models/Order.js'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { sendOrderStatusUpdate, sendPaymentStatusUpdate } from '../utils/sendEmail.js'

export const adminOrdersRouter = Router()

adminOrdersRouter.use(requireAdminToken)

adminOrdersRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
    const status = (req.query.status ?? '').toString()
    const payment = (req.query.payment ?? '').toString()

    const filter = {}
    if (status) filter.orderStatus = status
    if (payment) filter.paymentStatus = payment

    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ])

    res.json({ items, page, limit, total })
  } catch (e) {
    next(e)
  }
})

adminOrdersRouter.get('/:id', async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id).lean()
    if (!o) return res.status(404).json({ error: 'Order not found' })
    res.json(o)
  } catch (e) {
    next(e)
  }
})

const UpdateSchema = z.object({
  orderStatus: z.enum(['created', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['paid', 'failed', 'pending']).optional(),
})

adminOrdersRouter.put('/:id', async (req, res, next) => {
  try {
    const data = UpdateSchema.parse(req.body)
    const before = await Order.findById(req.params.id).lean()
    if (!before) return res.status(404).json({ error: 'Order not found' })

    const updated = await Order.findByIdAndUpdate(req.params.id, data, { new: true }).lean()
    res.json(updated)

    const orderStatusChanged =
      data.orderStatus !== undefined && before.orderStatus && updated?.orderStatus && before.orderStatus !== updated.orderStatus
    const paymentStatusChanged =
      data.paymentStatus !== undefined &&
      before.paymentStatus &&
      updated?.paymentStatus &&
      before.paymentStatus !== updated.paymentStatus

    if (!orderStatusChanged && !paymentStatusChanged) return

    ;(async () => {
      try {
        const user = await clerkClient.users.getUser(updated.userId)
        const email =
          user?.emailAddresses?.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          ''
        const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'
        const customer = { name, email }

        if (orderStatusChanged) {
          await sendOrderStatusUpdate(updated, customer)
        }
        if (paymentStatusChanged) {
          await sendPaymentStatusUpdate(updated, customer)
        }
      } catch (e) {
        console.error('Admin update email failed', e)
      }
    })()
  } catch (e) {
    next(e)
  }
})

