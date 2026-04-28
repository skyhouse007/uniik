import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { loadFromStorage, saveToStorage } from '../../utils/storage'

type WishlistState = {
  productIds: string[]
}

const STORAGE_KEY = 'cozyfoam.wishlist.v1'

const initialState: WishlistState = loadFromStorage<WishlistState>(STORAGE_KEY, {
  productIds: [],
})

function persist(state: WishlistState) {
  saveToStorage(STORAGE_KEY, state)
}

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const idx = state.productIds.indexOf(id)
      if (idx >= 0) state.productIds.splice(idx, 1)
      else state.productIds.unshift(id)
      persist(state)
    },
    clearWishlist: (state) => {
      state.productIds = []
      persist(state)
    },
  },
})

export const wishlistReducer = wishlistSlice.reducer
export const wishlistActions = wishlistSlice.actions

