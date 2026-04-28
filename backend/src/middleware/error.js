import { z } from 'zod'
import { env } from '../config/env.js'

export function notFound(req, res) {
  res.status(404).json({ error: 'Not Found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof z.ZodError) {
    const first = err.issues?.[0]
    const msg = first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Validation failed'
    return res.status(400).json({ error: msg, issues: err.issues })
  }
  const status = err?.statusCode ?? 500
  const message = err?.message ?? 'Server error'
  if (env.NODE_ENV === 'development' || status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
  res.status(status).json({ error: message })
}

