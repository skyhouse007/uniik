import { configureStore } from '@reduxjs/toolkit'
import { cartReducer } from './slices/cartSlice'
import { wishlistReducer } from './slices/wishlistSlice'
import { recentlyViewedReducer } from './slices/recentlyViewedSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    recentlyViewed: recentlyViewedReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

