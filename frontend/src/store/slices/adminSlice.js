import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// Admin-only read models that have no home in an existing slice. Feature slices
// (products, orders, users, trade-ins) stay untouched; this slice only owns the
// cross-model dashboard aggregate and the payment view over orders.

export const fetchAdminDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (range, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/dashboard', { params: { range } })
      return data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load the dashboard')
    }
  }
)

export const fetchPayments = createAsyncThunk('admin/fetchPayments', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders/payments', { params })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load payments')
  }
})

export const fetchUserActivity = createAsyncThunk('admin/fetchUserActivity', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/users/${id}/activity`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load customer activity')
  }
})

export const fetchDealerActivity = createAsyncThunk('admin/fetchDealerActivity', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/users/dealers/${id}/activity`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dealer activity')
  }
})

export const fetchAdminCategories = createAsyncThunk('admin/fetchCategories', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/categories/all', { params })
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load categories')
  }
})

export const updateUserStatus = createAsyncThunk('admin/updateUserStatus', async ({ id, isActive }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/users/${id}/status`, { isActive })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update account status')
  }
})

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dashboard: null,
    dashboardRange: '30d',
    dashboardLoading: false,
    dashboardError: null,
    payments: { items: [], page: 1, pages: 1, total: 0, collected: 0, byStatus: {}, byMethod: {} },
    paymentsLoading: false,
    paymentsError: null,
    userActivity: null,
    userActivityLoading: false,
    userActivityError: null,
    dealerActivity: null,
    dealerActivityLoading: false,
    dealerActivityError: null,
    categories: [],
    categoriesLoading: false,
    categoriesError: null,
    statusSaving: false,
  },
  reducers: {
    setDashboardRange(state, action) {
      state.dashboardRange = action.payload
    },
    clearUserActivity(state) {
      state.userActivity = null
      state.userActivityError = null
    },
    clearDealerActivity(state) {
      state.dealerActivity = null
      state.dealerActivityError = null
    },
    clearPayments(state) {
      state.payments = { items: [], page: 1, pages: 1, total: 0, collected: 0, byStatus: {}, byMethod: {} }
      state.paymentsError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.dashboardLoading = true
        state.dashboardError = null
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false
        state.dashboard = action.payload
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.dashboardLoading = false
        state.dashboardError = action.payload
      })
      .addCase(fetchPayments.pending, (state) => {
        state.paymentsLoading = true
        state.paymentsError = null
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.paymentsLoading = false
        state.payments = {
          items: action.payload.data,
          page: action.payload.page,
          pages: action.payload.pages,
          total: action.payload.total,
          collected: action.payload.collected,
          byStatus: action.payload.byStatus,
          byMethod: action.payload.byMethod,
        }
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.paymentsLoading = false
        state.paymentsError = action.payload
      })
      .addCase(fetchUserActivity.pending, (state) => {
        state.userActivityLoading = true
        state.userActivityError = null
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.userActivityLoading = false
        state.userActivity = action.payload
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.userActivityLoading = false
        state.userActivityError = action.payload
      })
      .addCase(fetchDealerActivity.pending, (state) => {
        state.dealerActivityLoading = true
        state.dealerActivityError = null
      })
      .addCase(fetchDealerActivity.fulfilled, (state, action) => {
        state.dealerActivityLoading = false
        state.dealerActivity = action.payload
      })
      .addCase(fetchDealerActivity.rejected, (state, action) => {
        state.dealerActivityLoading = false
        state.dealerActivityError = action.payload
      })
      .addCase(fetchAdminCategories.pending, (state) => {
        state.categoriesLoading = true
        state.categoriesError = null
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false
        state.categories = action.payload
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.categoriesLoading = false
        state.categoriesError = action.payload
      })
      .addCase(updateUserStatus.pending, (state) => {
        state.statusSaving = true
      })
      .addCase(updateUserStatus.fulfilled, (state) => {
        state.statusSaving = false
      })
      .addCase(updateUserStatus.rejected, (state) => {
        state.statusSaving = false
      })
  }
})

export const { setDashboardRange, clearUserActivity, clearDealerActivity, clearPayments } = adminSlice.actions

export default adminSlice.reducer
