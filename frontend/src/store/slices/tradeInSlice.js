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
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats')
  }
})

export const fetchAllTradeInRequests = createAsyncThunk('tradeIn/fetchAll', async (status = '', { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tradein/admin', { params: { status: status || undefined } })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load requests')
  }
})

export const deleteTradeInRequest = createAsyncThunk('tradeIn/delete', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/tradein/${id}`)
    return { id, message: data.message }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete request')
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

const patchRequest = (list, updated) =>
  list.map((r) => (r._id === updated._id ? updated : r))

const initialState = {
  dealers: [],
  myRequests: [],
  dealerRequests: [],
  allRequests: [],
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
        state.dealerRequests = patchRequest(state.dealerRequests, action.payload)
        state.allRequests = patchRequest(state.allRequests, action.payload)
        state.myRequests = patchRequest(state.myRequests, action.payload)
      })

      // Reject
      .addCase(rejectTradeInRequest.fulfilled, (state, action) => {
        state.dealerRequests = patchRequest(state.dealerRequests, action.payload)
        state.allRequests = patchRequest(state.allRequests, action.payload)
        state.myRequests = patchRequest(state.myRequests, action.payload)
      })

      // Complete
      .addCase(completeTradeInRequest.fulfilled, (state, action) => {
        state.dealerRequests = patchRequest(state.dealerRequests, action.payload)
        state.allRequests = patchRequest(state.allRequests, action.payload)
        state.myRequests = patchRequest(state.myRequests, action.payload)
      })

      // Cancel
      .addCase(cancelTradeInRequest.fulfilled, (state, action) => {
        state.myRequests = patchRequest(state.myRequests, action.payload)
      })

      // Admin list
      .addCase(fetchAllTradeInRequests.pending, (state) => { state.loading = true })
      .addCase(fetchAllTradeInRequests.fulfilled, (state, action) => {
        state.loading = false
        state.allRequests = action.payload
      })
      .addCase(fetchAllTradeInRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deleteTradeInRequest.fulfilled, (state, action) => {
        state.allRequests = state.allRequests.filter((r) => r._id !== action.payload.id)
      })
  },
})

export const { clearTradeInError } = tradeInSlice.actions
export default tradeInSlice.reducer