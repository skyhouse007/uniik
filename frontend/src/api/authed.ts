import { api } from './client'

export async function authedGet<T>(url: string, token: string, params?: unknown) {
  const res = await api.get<T>(url, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function authedPost<T>(url: string, body: unknown, token: string) {
  const res = await api.post<T>(url, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

