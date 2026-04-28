import { api } from './client'
import { getAdminToken } from '../utils/adminAuth'

export async function adminLogin(email: string, password: string) {
  const res = await api.post<{ token: string; admin: { email: string } }>('/admin/login', { email, password })
  return res.data
}

export async function adminMe() {
  const token = getAdminToken()
  if (!token) {
    throw new Error('Missing admin token')
  }
  const res = await api.get<{ ok: true; admin: { email: string } }>('/admin/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

