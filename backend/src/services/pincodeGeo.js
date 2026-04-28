import { env } from '../config/env.js'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const cache = new Map()

let lastRequestAt = 0
const MIN_INTERVAL_MS = 1100

/** One geocode flow at a time (throttled HTTP + Nominatim policy). */
let queue = Promise.resolve()

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

function runQueued(fn) {
  const task = queue.then(() => fn())
  queue = task.catch(() => {})
  return task
}

async function nominatimHttpJson(url) {
  const now = Date.now()
  const wait = lastRequestAt + MIN_INTERVAL_MS - now
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()

  const ua =
    env.NOMINATIM_USER_AGENT?.trim() ||
    'CozyFoam/1.0 (delivery radius; contact: admin@cozyfoam.local)'
  const res = await fetch(url, {
    headers: { 'User-Agent': ua, Accept: 'application/json' },
  })
  if (!res.ok) return null
  return res.json()
}

/**
 * Approximate lat/lng for an Indian pincode via OpenStreetMap Nominatim.
 * Results are cached; outbound requests are throttled.
 * @param {string} pincode — 6-digit string
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function geocodeIndiaPincode(pincode) {
  const key = String(pincode).replace(/\D/g, '')
  if (key.length !== 6) return null

  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) {
    return { lat: hit.lat, lng: hit.lng }
  }

  return runQueued(async () => {
    const again = cache.get(key)
    if (again && Date.now() - again.t < CACHE_TTL_MS) {
      return { lat: again.lat, lng: again.lng }
    }

    const primary = `https://nominatim.openstreetmap.org/search?countrycodes=in&postalcode=${encodeURIComponent(key)}&format=json&limit=1`
    let data = await nominatimHttpJson(primary)
    if (!Array.isArray(data) || data.length === 0) {
      const fallback = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${key}, India`)}&format=json&limit=1&countrycodes=in`
      data = await nominatimHttpJson(fallback)
    }
    if (!Array.isArray(data) || data.length === 0) return null

    const lat = parseFloat(data[0].lat)
    const lng = parseFloat(data[0].lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    cache.set(key, { lat, lng, t: Date.now() })
    return { lat, lng }
  })
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
