import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

function verifyToken(token) {
  if (!env.ADMIN_JWT_SECRET) throw new Error('Missing ADMIN_JWT_SECRET')
  return jwt.verify(token, env.ADMIN_JWT_SECRET)
}

export function requireAdminToken(req, res, next) {
  const raw = req.headers.authorization ?? ''
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = verifyToken(token)
    if (payload?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

