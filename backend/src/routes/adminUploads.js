import { Router } from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { requireAdminToken } from '../middleware/adminAuth.js'
import { env } from '../config/env.js'

export const adminUploadsRouter = Router()

adminUploadsRouter.use(requireAdminToken)

adminUploadsRouter.get('/signature', async (req, res) => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary env is not configured' })
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  })

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = (req.query.folder ?? 'cozyfoam/products').toString()
  const resourceType = (req.query.resourceType ?? 'image').toString() // image | raw
  const publicId = (req.query.publicId ?? '').toString()
  const useFilename = (req.query.useFilename ?? 'false').toString() === 'true'

  const toSign = { timestamp, folder }
  if (resourceType === 'raw') {
    // allow .glb upload (Cloudinary raw)
    // include a stable public_id if provided
    if (publicId) toSign.public_id = publicId
    if (useFilename) toSign.use_filename = true
    toSign.unique_filename = true
  }

  const signature = cloudinary.utils.api_sign_request(toSign, env.CLOUDINARY_API_SECRET)
  res.json({
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
    resourceType,
    publicId: publicId || undefined,
    useFilename,
  })
})

