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

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { rejectWithValue, getState }) => {
  try {
    const { data } = await api.post(`/users/wishlist/${productId}`)
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload
      })
      .addCase(toggleWishlist.pending, (state) => { state.loading = true })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.loading = false
        // The API returns the updated wishlist IDs, refetch will update items
        toast.success('Wishlist updated!')
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.loading = false
        if (action.payload) toast.error(action.payload)
      })
  },
})

export default wishlistSlice.reducer
