import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { loadFromStorage, saveToStorage } from '../../utils/storage'

export type CartItem = {
  productId: string
  name: string
  image?: string
  /** Final line price per unit after variant discount */
  unitPrice: number
  quantity: number
  /** Single, Double, Queen, King, etc. Empty for legacy SKUs. */
  selectedVariantCategory: string
  selectedSize: string
  selectedThickness: string
}

type CartLineRef = {
  productId: string
  selectedVariantCategory?: string
  selectedSize?: string
  selectedThickness?: string
  /** @deprecated */
  size?: string
}

function lineKey(i: CartLineRef) {
  const c = String(i.selectedVariantCategory ?? '').trim()
  const s = i.selectedSize ?? i.size ?? ''
  const t = i.selectedThickness ?? ''
  return `${i.productId}|${c}|${s}|${t}`
}

type CartState = {
  items: CartItem[]
  couponCode?: string
}

const STORAGE_KEY = 'cozyfoam.cart.v3'

function normalizeLoaded(raw: unknown): CartState {
  const d = raw as Partial<CartState> | null
  if (!d || !Array.isArray(d.items)) return { items: [] }
  return {
    items: d.items.map((i: any) => ({
      productId: String(i.productId),
      name: String(i.name ?? 'Product'),
      image: i.image,
      unitPrice: Math.max(0, Number(i.unitPrice) || 0),
      quantity: Math.min(99, Math.max(1, Number(i.quantity) || 1)),
      selectedVariantCategory: String(i.selectedVariantCategory ?? '').trim(),
      selectedSize: String(i.selectedSize ?? i.size ?? ''),
      selectedThickness: String(i.selectedThickness ?? ''),
    })),
    couponCode: d.couponCode,
  }
}

const initialState: CartState = normalizeLoaded(loadFromStorage(STORAGE_KEY, { items: [] }))

function persist(state: CartState) {
  saveToStorage(STORAGE_KEY, state)
}

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) => {
      const qty = action.payload.quantity ?? 1
      const k = lineKey(action.payload)
      const existing = state.items.find((i) => lineKey(i) === k)
      if (existing) existing.quantity = Math.min(99, existing.quantity + qty)
      else
        state.items.push({
          productId: action.payload.productId,
          name: action.payload.name,
          image: action.payload.image,
          unitPrice: action.payload.unitPrice,
          selectedVariantCategory: String(action.payload.selectedVariantCategory ?? '').trim(),
          selectedSize: action.payload.selectedSize,
          selectedThickness: action.payload.selectedThickness,
          quantity: qty,
        })
      persist(state)
    },
    removeFromCart: (state, action: PayloadAction<CartLineRef>) => {
      const k = lineKey(action.payload)
      state.items = state.items.filter((i) => lineKey(i) !== k)
      persist(state)
    },
    setQuantity: (state, action: PayloadAction<CartLineRef & { quantity: number }>) => {
      const k = lineKey(action.payload)
      const item = state.items.find((i) => lineKey(i) === k)
      if (!item) return
      item.quantity = Math.max(1, Math.min(99, action.payload.quantity))
      persist(state)
    },
    clearCart: (state) => {
      state.items = []
      state.couponCode = undefined
      persist(state)
    },
    applyCoupon: (state, action: PayloadAction<string>) => {
      state.couponCode = action.payload.trim().toUpperCase()
      persist(state)
    },
    removeCoupon: (state) => {
      state.couponCode = undefined
      persist(state)
    },
  },
})

export const cartReducer = cartSlice.reducer
export const cartActions = cartSlice.actions

export function selectCartSubtotal(state: CartState) {
  return state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
}
