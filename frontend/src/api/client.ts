import axios from 'axios'

function normalizeApiBaseUrl(raw: string | undefined): string {
  const fallback = 'http://localhost:4000/api'
  const v = String(raw ?? '').trim()
  if (!v) return fallback
  const noTrailing = v.replace(/\/+$/, '')
  if (noTrailing.toLowerCase().endsWith('/api')) return noTrailing
  return `${noTrailing}/api`
}

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  withCredentials: false,
})

