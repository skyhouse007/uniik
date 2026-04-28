import mongoose from 'mongoose'
import { env } from './env.js'

function shouldFallbackToLocal(err, uri) {
  const msg = String(err?.message ?? '')
  const code = err?.code
  const syscall = err?.syscall
  const isSrv = typeof uri === 'string' && uri.startsWith('mongodb+srv://')
  if (!isSrv) return false
  return (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    syscall === 'querySrv' ||
    msg.includes('querySrv') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED')
  )
}

export async function connectDb() {
  if (!env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI')
  }
  mongoose.set('strictQuery', true)
  try {
    await mongoose.connect(env.MONGODB_URI)
  } catch (err) {
    const isDev = env.NODE_ENV !== 'production'
    if (isDev && shouldFallbackToLocal(err, env.MONGODB_URI)) {
      const localUri = 'mongodb://127.0.0.1:27017/cozyfoam'
      // eslint-disable-next-line no-console
      console.warn(
        'MongoDB Atlas DNS failed; falling back to local MongoDB at mongodb://127.0.0.1:27017/cozyfoam',
      )
      await mongoose.connect(localUri)
    } else {
      throw err
    }
  }
  return mongoose.connection
}

