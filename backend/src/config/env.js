import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** Load `backend/.env` even when process cwd is repo root or another folder. */
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

function must(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: process.env.MONGODB_URI ?? '',

  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? '',
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? '',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? '',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase(),
  ADMIN_PASSWORD: (process.env.ADMIN_PASSWORD ?? '').trim(),
  ADMIN_JWT_SECRET: (process.env.ADMIN_JWT_SECRET ?? '').trim(),

  /** Identifying User-Agent for OpenStreetMap Nominatim (pincode geocoding). */
  NOMINATIM_USER_AGENT: process.env.NOMINATIM_USER_AGENT ?? '',

  /** SMTP (Nodemailer) */
  MAIL_HOST: process.env.MAIL_HOST ?? '',
  MAIL_PORT: process.env.MAIL_PORT ?? '',
  MAIL_USER: process.env.MAIL_USER ?? '',
  MAIL_PASS: process.env.MAIL_PASS ?? '',
  MAIL_FROM: process.env.MAIL_FROM ?? '',

  must,
}

