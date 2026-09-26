import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchDealers = createAsyncThunk('tradeIn/fetchDealers', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tradein/dealers')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dealers')
  }
})

export const createTradeInRequest = createAsyncThunk('tradeIn/create', async (payload, { rejectWithValue }) => {
  try {
    const formData = new FormData()
    Object.entries(payload.fields).forEach(([key, value]) => {
      if (value !== undefined && value !== '') formData.append(key, value)
    })
    payload.images.forEach((file) => formData.append('images', file))
    const { data } = await api.post('/tradein', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit request')
  }
})

export const fetchMyRequests = createAsyncThunk('tradeIn/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tradein/my')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load requests')
  }
})

export const fetchDealerRequests = createAsyncThunk('tradeIn/fetchDealer', async (status = '', { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tradein/dealer-requests', { params: { status: status || undefined } })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load requests')
  }
})

export const fetchDealerStats = createAsyncThunk('tradeIn/fetchDealerStats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tradein/stats/dealer')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load stats')
  }
})

export const approveTradeInRequest = createAsyncThunk('tradeIn/approve', async ({ id, dealerPrice, note }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tradein/${id}/approve`, { dealerPrice, note })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to approve request')
  }
})

export const rejectTradeInRequest = createAsyncThunk('tradeIn/reject', async ({ id, note }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tradein/${id}/reject`, { note })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to reject request')
  }
})

export const completeTradeInRequest = createAsyncThunk('tradeIn/complete', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tradein/${id}/complete`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to complete request')
  }
})

export const cancelTradeInRequest = createAsyncThunk('tradeIn/cancel', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tradein/${id}/cancel`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to cancel request')
  }
})

const initialState = {
  dealers: [],
  myRequests: [],
  dealerRequests: [],
  dealerStats: { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 },
  loading: false,
  submitting: false,
  error: null,
}

const tradeInSlice = createSlice({
  name: 'tradeIn',
  initialState,
  reducers: {
    clearTradeInError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Dealers
      .addCase(fetchDealers.pending, (state) => { state.loading = true })
      .addCase(fetchDealers.fulfilled, (state, action) => {
        state.loading = false
        state.dealers = action.payload
      })
      .addCase(fetchDealers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create
      .addCase(createTradeInRequest.pending, (state) => { state.submitting = true })
      .addCase(createTradeInRequest.fulfilled, (state, action) => {
        state.submitting = false
        state.myRequests = [action.payload, ...state.myRequests]
      })
      .addCase(createTradeInRequest.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload
      })

      // My requests
      .addCase(fetchMyRequests.pending, (state) => { state.loading = true })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.loading = false
        state.myRequests = action.payload
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Dealer requests
      .addCase(fetchDealerRequests.pending, (state) => { state.loading = true })
      .addCase(fetchDealerRequests.fulfilled, (state, action) => {
        state.loading = false
        state.dealerRequests = action.payload
      })
      .addCase(fetchDealerRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Dealer stats
      .addCase(fetchDealerStats.fulfilled, (state, action) => {
        state.dealerStats = action.payload
      })

      // Approve
      .addCase(approveTradeInRequest.fulfilled, (state, action) => {
        state.dealerRequests = state.dealerRequests.map((r) =>
          (r._id === action.payload._id ? action.payload : r)
        )
      })

      // Reject
      .addCase(rejectTradeInRequest.fulfilled, (state, action) => {
        state.dealerRequests = state.dealerRequests.map((r) =>
          (r._id === action.payload._id ? action.payload : r)
        )
      })

      // Complete
      .addCase(completeTradeInRequest.fulfilled, (state, action) => {
        state.dealerRequests = state.dealerRequests.map((r) =>
          (r._id === action.payload._id ? action.payload : r)
        )
      })

      // Cancel
      .addCase(cancelTradeInRequest.fulfilled, (state, action) => {
        state.myRequests = state.myRequests.map((r) =>
          (r._id === action.payload._id ? action.payload : r)
        )
      })
  },
})

export const { clearTradeInError } = tradeInSlice.actions
export default tradeInSlice.reducer