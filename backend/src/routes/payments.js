import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { env } from '../config/env.js'
import { requireClerkAuth } from '../middleware/auth.js'
import { Cart } from '../models/Cart.js'
import { Order } from '../models/Order.js'
import { PaymentAttempt } from '../models/PaymentAttempt.js'
import { Product } from '../models/Product.js'
import { computeVariantUnitPrice, findVariant } from '../utils/pricing.js'
import { normalizePincode, resolveProductDelivery } from '../utils/productDelivery.js'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { sendOrderConfirmation } from '../utils/sendEmail.js'

export const paymentsRouter = Router()

function razorpayClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    const err = new Error('Missing Razorpay env vars (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)')
    // surface a clear response instead of a generic 500
    err.statusCode = 500
    throw err
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
}

const CreateOrderSchema = z.object({
  // tolerate clients sending strings/floats; store as integer paise
  amountInPaise: z.coerce.number().finite().transform((n) => Math.round(n)).pipe(z.number().int().min(100)),
  currency: z.string().default('INR'),
  receipt: z.string().optional(),
})

paymentsRouter.post('/razorpay/order', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const payload = CreateOrderSchema.parse(req.body)

    const rzp = razorpayClient()
    const safeReceipt = String(payload.receipt ?? `rcpt_${Date.now()}_${String(userId ?? '').slice(-6)}`)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 40)
    const order = await rzp.orders.create({
      amount: payload.amountInPaise,
      currency: payload.currency,
      receipt: safeReceipt,
      notes: { userId },
    })

    await PaymentAttempt.create({
      userId,
      status: 'created',
      amountInPaise: Number(order.amount),
      currency: String(order.currency || payload.currency || 'INR'),
      razorpay: { orderId: order.id },
    })

    res.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    })
  } catch (e) {
    next(e)
  }
})

const FailSchema = z.object({
  razorpay_order_id: z.string().min(1),
  error: z
    .object({
      code: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
})

paymentsRouter.post('/razorpay/fail', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const payload = FailSchema.parse(req.body)
    const attempt = await PaymentAttempt.findOne({ userId, 'razorpay.orderId': payload.razorpay_order_id })
    if (!attempt) return res.status(404).json({ error: 'Payment attempt not found' })
    if (attempt.status === 'paid') return res.json({ ok: true })
    attempt.status = payload.error ? 'failed' : 'cancelled'
    attempt.razorpay.errorCode = payload.error?.code
    attempt.razorpay.errorDescription = payload.error?.description
    await attempt.save()
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

const LineItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  image: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  selectedVariantCategory: z.string().optional().default(''),
  selectedSize: z.string().min(1),
  selectedThickness: z.string().min(1),
  unitPrice: z.number().nonnegative(),
})

const VerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
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
  lineItems: z.array(LineItemSchema).min(1),
  couponDiscount: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
})

async function validateLineItems(items, addressPincode) {
  const addrPin = normalizePincode(addressPincode)
  if (!addrPin) {
    const err = new Error('Enter a valid 6-digit delivery pincode')
    err.statusCode = 400
    throw err
  }

  let total = 0
  const products = []
  for (const line of items) {
    const p = await Product.findById(line.productId).lean()
    if (!p) {
      const err = new Error('Product not found')
      err.statusCode = 400
      throw err
    }
    const v = findVariant(p, line.selectedSize, line.selectedThickness, line.selectedVariantCategory ?? '')
    if (!v) {
      const err = new Error('Invalid variant')
      err.statusCode = 400
      throw err
    }
    const expected = computeVariantUnitPrice(v, line.selectedSize)
    if (Math.abs(expected - line.unitPrice) > 2) {
      const err = new Error('Price mismatch — refresh and try again')
      err.statusCode = 400
      throw err
    }
    if (v.stock < line.quantity) {
      const err = new Error(`Insufficient stock for ${p.productName}`)
      err.statusCode = 400
      throw err
    }

    const delivery = await resolveProductDelivery(p, addrPin)
    if (!delivery.ok) {
      const err = new Error(delivery.message ?? `Delivery not available for ${p.productName}`)
      err.statusCode = 400
      throw err
    }

    total += expected * line.quantity
    products.push({
      productId: p._id,
      name: p.productName,
      image: p.thumbnail || p.images?.[0],
      unitPrice: expected,
      quantity: line.quantity,
      selectedVariantCategory: String(line.selectedVariantCategory ?? '').trim(),
      selectedSize: line.selectedSize,
      selectedThickness: line.selectedThickness,
      size: line.selectedSize,
    })
  }
  return { total, products }
}

paymentsRouter.post('/razorpay/verify', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const payload = VerifySchema.parse(req.body)

    if (!env.RAZORPAY_KEY_SECRET) throw new Error('Missing RAZORPAY_KEY_SECRET')

    const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`
    const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(body).digest('hex')
    if (expected !== payload.razorpay_signature) {
      await PaymentAttempt.updateOne(
        { userId, 'razorpay.orderId': payload.razorpay_order_id },
        { $set: { status: 'failed', 'razorpay.paymentId': payload.razorpay_payment_id, 'razorpay.signature': payload.razorpay_signature } },
      )
      return res.status(400).json({ error: 'Invalid payment signature' })
    }

    // Idempotency: if we've already created an order for this payment/order, return it.
    const existingAttempt = await PaymentAttempt.findOne({ userId, 'razorpay.orderId': payload.razorpay_order_id }).lean()
    if (existingAttempt?.orderId) {
      return res.json({ ok: true, orderId: String(existingAttempt.orderId) })
    }
    const existingOrder = await Order.findOne({ 'razorpay.paymentId': payload.razorpay_payment_id }).lean()
    if (existingOrder?._id) {
      await PaymentAttempt.updateOne(
        { userId, 'razorpay.orderId': payload.razorpay_order_id },
        { $set: { status: 'paid', orderId: existingOrder._id, 'razorpay.paymentId': payload.razorpay_payment_id, 'razorpay.signature': payload.razorpay_signature } },
      )
      return res.json({ ok: true, orderId: existingOrder._id.toString() })
    }

    const { total, products } = await validateLineItems(payload.lineItems, payload.address.pincode)
    const couponDiscount = Math.min(total, payload.couponDiscount ?? 0)
    const shipping = payload.shipping ?? 0
    const grandTotal = Math.max(0, total - couponDiscount + shipping)
    const expectedPaise = Math.round(grandTotal * 100)
    const rzp = razorpayClient()
    const paid = await rzp.orders.fetch(payload.razorpay_order_id)
    const paidAmount = Number(paid.amount)
    if (paidAmount !== expectedPaise) {
      await PaymentAttempt.updateOne(
        { userId, 'razorpay.orderId': payload.razorpay_order_id },
        { $set: { status: 'failed', 'razorpay.paymentId': payload.razorpay_payment_id, 'razorpay.signature': payload.razorpay_signature, 'razorpay.errorDescription': 'Order amount mismatch' } },
      )
      return res.status(400).json({ error: 'Order amount does not match cart' })
    }

    const order = await Order.create({
      userId,
      products,
      totalAmount: grandTotal,
      paymentMethod: 'Razorpay',
      paymentStatus: 'paid',
      orderStatus: 'created',
      address: payload.address,
      razorpay: {
        orderId: payload.razorpay_order_id,
        paymentId: payload.razorpay_payment_id,
        signature: payload.razorpay_signature,
      },
    })

    await PaymentAttempt.updateOne(
      { userId, 'razorpay.orderId': payload.razorpay_order_id },
      {
        $set: {
          status: 'paid',
          orderId: order._id,
          'razorpay.paymentId': payload.razorpay_payment_id,
          'razorpay.signature': payload.razorpay_signature,
        },
      },
      { upsert: true },
    )

    await Cart.updateOne({ userId }, { $set: { products: [] } })

    res.json({ ok: true, orderId: order._id.toString() })

    ;(async () => {
      try {
        const user = await clerkClient.users.getUser(userId)
        const email =
          user?.emailAddresses?.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          ''
        const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'
        await sendOrderConfirmation(order?.toObject?.() ?? order, { name, email })
      } catch (e) {
        console.error('Order confirmation email failed', e)
      }
    })()
  } catch (e) {
    if (e && typeof e.statusCode === 'number') return res.status(e.statusCode).json({ error: e.message })
    next(e)
  }
})
