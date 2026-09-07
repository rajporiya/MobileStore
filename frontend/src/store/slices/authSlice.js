import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('userInfo', JSON.stringify(data.data))
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const requestRegistrationOtp = createAsyncThunk('auth/requestRegistrationOtp', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register/request-otp', userData)
    return data.message
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not send verification code')
  }
})

export const verifyRegistrationOtp = createAsyncThunk('auth/verifyRegistrationOtp', async (dataToVerify, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register/verify-otp', dataToVerify)
    localStorage.setItem('userInfo', JSON.stringify(data.data))
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Verification failed')
  }
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/profile', userData)
    localStorage.setItem('userInfo', JSON.stringify(data.data))
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userInfo: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.userInfo = null
      localStorage.removeItem('userInfo')
      toast.success('Logged out successfully')
    },
    loadUserFromStorage(state) {
      const stored = localStorage.getItem('userInfo')
      if (stored) {
        state.userInfo = JSON.parse(stored)
      }
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
        toast.success(`Welcome back, ${action.payload.name}!`)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      .addCase(requestRegistrationOtp.pending, (state) => { state.loading = true; state.error = null })
      .addCase(requestRegistrationOtp.fulfilled, (state) => {
        state.loading = false
        toast.success('Verification code sent to your email')
      })
      .addCase(requestRegistrationOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      .addCase(verifyRegistrationOtp.pending, (state) => { state.loading = true; state.error = null })
      .addCase(verifyRegistrationOtp.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
        toast.success(`Welcome to Mobile Store, ${action.payload.name}!`)
      })
      .addCase(verifyRegistrationOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      .addCase(updateProfile.pending, (state) => { state.loading = true })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
        toast.success('Profile updated successfully!')
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        toast.error(action.payload)
      })
  },
})

export const { logout, loadUserFromStorage, clearError } = authSlice.actions
export default authSlice.reducer
