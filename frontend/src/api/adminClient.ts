import { api } from './client'
import { getAdminToken } from '../utils/adminAuth'

export function adminHeaders(): Record<string, string> {
  const token = getAdminToken()
  /** Use a dedicated header so Clerk/other middleware never parses admin JWT as `Authorization`. */
  return token ? { 'X-Admin-Token': token } : {}
}

/** Avoid conditional GET (304 + empty body): Express sets ETag on JSON; axios often leaves `data` empty on 304. */
function adminRequestHeaders(): Record<string, string> {
  return {
    ...adminHeaders(),
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  }
}

export async function adminGet<T>(url: string, params?: any) {
  const res = await api.get<T>(url, {
    params: { ...params, _cb: Date.now() },
    headers: adminRequestHeaders(),
  })
  return res.data
}

export async function adminPost<T>(url: string, body: any) {
  const res = await api.post<T>(url, body, { headers: adminRequestHeaders() })
  return res.data
}

export async function adminPut<T>(url: string, body: any) {
  const res = await api.put<T>(url, body, { headers: adminRequestHeaders() })
  return res.data
}

export async function adminDelete<T>(url: string) {
  const res = await api.delete<T>(url, { headers: adminRequestHeaders() })
  return res.data
}

