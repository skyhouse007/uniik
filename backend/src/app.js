import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { clerkMiddleware } from '@clerk/express'

import { productsRouter } from './routes/products.js'
import { categoriesRouter, postCategoriesReorder } from './routes/categories.js'
import { cartRouter } from './routes/cart.js'
import { ordersRouter } from './routes/orders.js'
import { searchRouter } from './routes/search.js'
import { paymentsRouter } from './routes/payments.js'
import { authRouter } from './routes/auth.js'
import { adminAuthRouter } from './routes/adminAuth.js'
import { adminOrdersRouter } from './routes/adminOrders.js'
import { adminUploadsRouter } from './routes/adminUploads.js'
import { siteRouter } from './routes/site.js'
import { adminContentRouter } from './routes/adminContent.js'
import { notFound, errorHandler } from './middleware/error.js'
import { requireAdminToken } from './middleware/adminAuth.js'
import { env } from './config/env.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan('dev'))

  // Backend authentication uses Clerk's server-side middleware; publishable key is not required here.
  const maybeClerk = env.CLERK_SECRET_KEY ? clerkMiddleware() : (req, res, next) => next()

  app.get('/health', (req, res) => res.json({ ok: true }))

  // Public catalog APIs (do not require Clerk)
  // Note: products router also contains a customer review POST route which requires Clerk;
  // maybeClerk becomes a no-op when Clerk is not configured.
  app.use('/api/products', maybeClerk, productsRouter)
  app.post('/api/categories/reorder', requireAdminToken, postCategoriesReorder)
  app.use('/api/categories', categoriesRouter)
  // Customer-authenticated APIs (require Clerk when configured)
  app.use('/api/auth', maybeClerk, authRouter)
  app.use('/api/cart', maybeClerk, cartRouter)
  app.use('/api/orders', maybeClerk, ordersRouter)
  app.use('/api/search', searchRouter)

  app.use('/api/payments', maybeClerk, paymentsRouter)
  app.use('/api/site', siteRouter)

  // Admin APIs (explicitly NOT using Clerk)
  app.use('/api/admin', adminAuthRouter)
  app.use('/api/admin/orders', adminOrdersRouter)
  app.use('/api/admin/uploads', adminUploadsRouter)
  app.use('/api/admin/content', adminContentRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}

