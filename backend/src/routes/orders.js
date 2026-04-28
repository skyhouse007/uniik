import { Router } from 'express'
import { z } from 'zod'
import { requireClerkAuth } from '../middleware/auth.js'
import { Order } from '../models/Order.js'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { sendOrderConfirmation } from '../utils/sendEmail.js'

export const ordersRouter = Router()

ordersRouter.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const items = await Order.find({ userId }).sort({ createdAt: -1 }).lean()
    res.json({ items })
  } catch (e) {
    next(e)
  }
})

ordersRouter.get('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const o = await Order.findById(req.params.id).lean()
    if (!o) return res.status(404).json({ error: 'Order not found' })
    if (o.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    res.json(o)
  } catch (e) {
    next(e)
  }
})

const CreateSchema = z.object({
  products: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        image: z.string().optional(),
        unitPrice: z.number().nonnegative(),
        quantity: z.number().int().min(1).max(99),
        size: z.string().optional(),
      }),
    )
    .min(1),
  totalAmount: z.number().nonnegative(),
  address: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    landmark: z.string().optional(),
  }),
})

ordersRouter.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const payload = CreateSchema.parse(req.body)
    const created = await Order.create({
      userId,
      products: payload.products,
      totalAmount: payload.totalAmount,
      paymentStatus: 'pending',
      orderStatus: 'created',
      address: payload.address,
    })
    res.status(201).json(created)

    ;(async () => {
      try {
        const user = await clerkClient.users.getUser(userId)
        const email =
          user?.emailAddresses?.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          ''
        const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'
        await sendOrderConfirmation(created?.toObject?.() ?? created, { name, email })
      } catch (e) {
        console.error('Order confirmation email failed', e)
      }
    })()
  } catch (e) {
    next(e)
  }
})

