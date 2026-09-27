import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/wishlist')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/users/wishlist/${productId}`)
    // The API now returns the full populated wishlist after toggling, so the
    // slice can replace its state without a second request.
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {
    // Called on logout / session end so stale items don't leak into a new session.
    clearWishlist(state) {
      state.items = []
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload
        state.loading = false
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.loading = false
      })
      .addCase(toggleWishlist.pending, (state) => {
        state.loading = true
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.loading = false
        // Replace state with the server's view — no refetch, no race window.
        state.items = action.payload
        toast.success('Wishlist updated!')
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.loading = false
        if (action.payload) toast.error(action.payload)
      })
  },
})

export const { clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
