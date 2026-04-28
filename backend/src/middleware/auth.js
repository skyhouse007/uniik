import { getAuth } from '@clerk/express'
import { clerkClient } from '@clerk/clerk-sdk-node'

export function requireClerkAuth(req, res, next) {
  let auth
  try {
    auth = getAuth(req)
  } catch (e) {
    // This happens when clerkMiddleware() wasn't registered (typically missing CLERK_SECRET_KEY in env).
    return res.status(401).json({
      error: 'Auth not configured',
      details: 'Missing Clerk configuration on server (CLERK_SECRET_KEY).',
    })
  }
  if (!auth?.userId) return res.status(401).json({ error: 'Unauthorized' })
  req.auth = auth
  return next()
}

export async function requireAdmin(req, res, next) {
  const auth = getAuth(req)
  if (!auth?.userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const user = await clerkClient.users.getUser(auth.userId)
    const role = user?.publicMetadata?.role ?? 'user'
    if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    req.auth = auth
    next()
  } catch {
    return res.status(500).json({ error: 'Failed to authorize admin' })
  }
}

