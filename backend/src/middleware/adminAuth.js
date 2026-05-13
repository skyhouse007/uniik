import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

function extractAdminToken(req) {
  const raw = req.headers.authorization ?? ''
  const bearer = raw.startsWith('Bearer ') ? raw.slice(7).trim() : ''
  /** Prefer separate header so Clerk never treats admin JWT as a session token on shared mounts. */
  const dedicated =
    typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'].trim() : ''
  return dedicated || bearer
}

function verifyToken(token) {
  if (!env.ADMIN_JWT_SECRET) throw new Error('Missing ADMIN_JWT_SECRET')
  return jwt.verify(token, env.ADMIN_JWT_SECRET)
}

export function requireAdminToken(req, res, next) {
  const token = extractAdminToken(req)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = verifyToken(token)
    if (payload?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    req.admin = payload
    next()
  } catch (e) {
    if (e?.message === 'Missing ADMIN_JWT_SECRET') {
      return res.status(503).json({ error: 'Admin auth not configured (ADMIN_JWT_SECRET)' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

