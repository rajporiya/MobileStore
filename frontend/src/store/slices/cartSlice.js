import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const cartItemsFromStorage = localStorage.getItem('cartItems')
  ? JSON.parse(localStorage.getItem('cartItems'))
  : []

const saveCart = (items) => {
  localStorage.setItem('cartItems', JSON.stringify(items))
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cartItems: cartItemsFromStorage,
  },
  reducers: {
    addToCart(state, action) {
      const item = action.payload
      const existing = state.cartItems.find((x) => x._id === item._id)
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, item.stock || 99)
        toast.success('Cart quantity updated!')
      } else {
        state.cartItems.push({ ...item, quantity: 1 })
        toast.success('Added to cart!')
      }
      saveCart(state.cartItems)
    },
    removeFromCart(state, action) {
      state.cartItems = state.cartItems.filter((x) => x._id !== action.payload)
      saveCart(state.cartItems)
      toast.success('Removed from cart')
    },
    updateQuantity(state, action) {
      const { id, quantity } = action.payload
      const item = state.cartItems.find((x) => x._id === id)
      if (item) {
        if (quantity <= 0) {
          state.cartItems = state.cartItems.filter((x) => x._id !== id)
        } else {
          item.quantity = quantity
        }
        saveCart(state.cartItems)
      }
    },
    clearCart(state) {
      state.cartItems = []
      localStorage.removeItem('cartItems')
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions

export const selectCartItems = (state) => state.cart.cartItems
export const selectCartTotal = (state) =>
  state.cart.cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
export const selectCartCount = (state) =>
  state.cart.cartItems.reduce((total, item) => total + item.quantity, 0)

export default cartSlice.reducer
