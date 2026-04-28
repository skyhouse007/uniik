import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { loadFromStorage, saveToStorage } from '../../utils/storage'

type RecentlyViewedState = {
  productIds: string[]
}

const STORAGE_KEY = 'cozyfoam.recentlyViewed.v1'
const MAX = 12

const initialState: RecentlyViewedState = loadFromStorage<RecentlyViewedState>(STORAGE_KEY, {
  productIds: [],
})

function persist(state: RecentlyViewedState) {
  saveToStorage(STORAGE_KEY, state)
}

export const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState,
  reducers: {
    viewed: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.productIds = [id, ...state.productIds.filter((x) => x !== id)].slice(0, MAX)
      persist(state)
    },
    clear: (state) => {
      state.productIds = []
      persist(state)
    },
  },
})

export const recentlyViewedReducer = recentlyViewedSlice.reducer
export const recentlyViewedActions = recentlyViewedSlice.actions

