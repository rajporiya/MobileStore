import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const createOrder = createAsyncThunk('orders/create', async (orderData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', orderData)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create order')
  }
})

export const fetchMyOrders = createAsyncThunk('orders/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders/myorders')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders')
  }
})

export const fetchAllOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders', { params })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders')
  }
})

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, orderStatus }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/orders/${id}/status`, { orderStatus })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update order')
  }
})

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    myOrders: [],
    allOrders: [],
    currentOrder: null,
    loading: false,
    error: null,
    total: 0,
    pages: 1,
  },
  reducers: {
    clearCurrentOrder(state) { state.currentOrder = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.loading = true; state.error = null })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
        toast.success('Order placed successfully!')
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false
        state.myOrders = action.payload
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchAllOrders.pending, (state) => { state.loading = true })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false
        state.allOrders = action.payload.data
        state.total = action.payload.total
        state.pages = action.payload.pages
      })
      .addCase(fetchAllOrders.rejected, (state) => { state.loading = false })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.allOrders.findIndex((o) => o._id === action.payload._id)
        if (idx !== -1) state.allOrders[idx] = action.payload
        toast.success('Order status updated!')
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        toast.error(action.payload)
      })
  },
})

export const { clearCurrentOrder } = orderSlice.actions
export default orderSlice.reducer
