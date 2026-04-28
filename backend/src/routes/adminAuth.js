import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../config/env.js'
import { requireAdminToken } from '../middleware/adminAuth.js'

export const adminAuthRouter = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

adminAuthRouter.post('/login', (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body)
    const validEmail = env.ADMIN_EMAIL
    const validPassword = env.ADMIN_PASSWORD
    if (!validEmail || !validPassword || !env.ADMIN_JWT_SECRET) {
      return res.status(500).json({ error: 'Admin auth env is not configured' })
    }
    if (email !== validEmail || password !== validPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' })
    }
    const token = jwt.sign({ role: 'admin', email }, env.ADMIN_JWT_SECRET, { expiresIn: '12h' })
    res.json({ token, admin: { email } })
  } catch (e) {
    next(e)
  }
})

adminAuthRouter.get('/me', requireAdminToken, (req, res) => {
  res.json({ ok: true, admin: { email: req.admin.email } })
})

