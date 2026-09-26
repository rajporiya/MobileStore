import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import authReducer from '../store/slices/authSlice'
import cartReducer from '../store/slices/cartSlice'
import productReducer from '../store/slices/productSlice'
import orderReducer from '../store/slices/orderSlice'
import wishlistReducer from '../store/slices/wishlistSlice'
import tradeInReducer from '../store/slices/tradeInSlice'
import adminReducer from '../store/slices/adminSlice'

const rootReducer = {
  auth: authReducer,
  cart: cartReducer,
  products: productReducer,
  orders: orderReducer,
  wishlist: wishlistReducer,
  tradeIn: tradeInReducer,
  admin: adminReducer,
}

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

export function renderWithProviders(
  ui,
  { preloadedState = {}, route = '/', store = createTestStore(preloadedState), ...renderOptions } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    )
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
