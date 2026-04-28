import { Router } from 'express'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { requireClerkAuth } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { sendWelcomeEmail } from '../utils/sendEmail.js'

export const authRouter = Router()

/**
 * Called after customer signup / first login.
 * Creates the Mongo user record (if missing) and triggers welcome email once.
 */
authRouter.post('/signup', requireClerkAuth, async (req, res, next) => {
  try {
    const clerkId = req.auth.userId
    const existing = await User.findOne({ clerkId }).lean()
    if (existing) return res.json({ ok: true, created: false })

    const clerkUser = await clerkClient.users.getUser(clerkId)
    const email =
      clerkUser?.emailAddresses?.find((e) => e.id === clerkUser?.primaryEmailAddressId)?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      ''
    const name =
      clerkUser?.fullName || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'Customer'

    const created = await User.create({ clerkId, name, email })

    ;(async () => {
      try {
        await sendWelcomeEmail({ name: created?.name, email: created?.email })
      } catch (e) {
        console.error('Welcome email failed', e)
      }
    })()

    res.status(201).json({ ok: true, created: true })
  } catch (e) {
    next(e)
  }
})

