import { geocodeIndiaPincode, haversineKm } from '../services/pincodeGeo.js'

export function normalizePincode(raw) {
  const s = String(raw ?? '').replace(/\D/g, '')
  return s.length === 6 ? s : ''
}

/**
 * @param {import('mongoose').LeanDocument<any>} product
 * @param {string} customerPinRaw
 * @returns {Promise<{ ok: boolean, deliveryDays?: number, message?: string }>}
 */
export async function resolveProductDelivery(product, customerPinRaw) {
  const pin = normalizePincode(customerPinRaw)
  if (!pin) {
    return { ok: false, message: 'Invalid pincode' }
  }

  const centerPin = normalizePincode(product.deliveryCenterPincode)
  const radiusKm = Number(product.deliveryRadiusKm)

  if (centerPin && Number.isFinite(radiusKm) && radiusKm > 0) {
    const centerGeo = await geocodeIndiaPincode(centerPin)
    const userGeo = await geocodeIndiaPincode(pin)
    if (!centerGeo || !userGeo) {
      return {
        ok: false,
        message: 'Sorry, we could not verify delivery for this pincode. Please try again later.',
      }
    }
    const km = haversineKm(centerGeo.lat, centerGeo.lng, userGeo.lat, userGeo.lng)
    if (km <= radiusKm) {
      const days = Math.max(1, Math.min(90, Number(product.radiusDeliveryDays) || 3))
      return { ok: true, deliveryDays: days }
    }
    return { ok: false, message: 'Sorry, delivery is not available in your area.' }
  }

  const normList = (product.deliverablePincodes ?? []).map((x) => ({
    ...x,
    pincode: normalizePincode(x.pincode) || String(x.pincode ?? '').replace(/\D/g, '').slice(0, 6),
  }))
  const entry = normList.find((x) => x.pincode === pin)
  if (!entry) {
    return { ok: false, message: 'Sorry, delivery is not available in your area.' }
  }
  return { ok: true, deliveryDays: entry.deliveryDays }
}
