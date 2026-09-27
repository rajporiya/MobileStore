import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products', { params })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch products')
  }
})

export const fetchProductById = createAsyncThunk('products/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/products/${id}`)
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Product not found')
  }
})

export const fetchFeaturedProducts = createAsyncThunk('products/fetchFeatured', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/featured')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch featured products')
  }
})

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/categories')
    return data.data || []
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories')
  }
})

export const fetchLatestProducts = createAsyncThunk('products/fetchLatest', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products', { params: { sort: 'newest', page: 1, limit: 8 } })
    return data.data || []
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch latest products')
  }
})

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    featured: [],
    latest: [],
    categories: [],
    featuredLoaded: false,
    latestLoaded: false,
    categoriesLoaded: false,
    selectedProduct: null,
    loading: false,
    // `fetching` is true for every fetchProducts run even when cached items
    // are on screen — the page dims the grid while it's set.
    fetching: false,
    error: null,
    page: 1,
    pages: 1,
    total: 0,
  },
  reducers: {
    clearProduct(state) {
      state.selectedProduct = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = state.items.length === 0
        state.fetching = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.fetching = false
        state.items = action.payload.data
        state.page = action.payload.page
        state.pages = action.payload.pages
        state.total = action.payload.total
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.fetching = false
        state.error = action.payload
      })
      .addCase(fetchProductById.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedProduct = action.payload
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.error = null
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featured = action.payload
        state.featuredLoaded = true
      })
      .addCase(fetchLatestProducts.fulfilled, (state, action) => {
        state.latest = action.payload
        state.latestLoaded = true
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
        state.categoriesLoaded = true
      })
  },
})

export const { clearProduct } = productSlice.actions
export default productSlice.reducer
