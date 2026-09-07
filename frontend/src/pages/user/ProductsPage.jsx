import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi'
import { fetchProducts } from '../../store/slices/productSlice'
import ProductCard from '../../components/user/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeletons'
import api from '../../services/api'

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
]

export default function ProductsPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, loading, page, pages, total } = useSelector((s) => s.products)

  const [filterOpen, setFilterOpen] = useState(false)
  const [categories, setCategories] = useState([])

  const currentSearch = searchParams.get('search') || ''
  const currentBrand = searchParams.get('brand') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentPage = Number(searchParams.get('page')) || 1
  const currentFeatured = searchParams.get('featured') || ''
  const currentMin = searchParams.get('minPrice') || ''
  const currentMax = searchParams.get('maxPrice') || ''

  useEffect(() => {
    const params = {}
    if (currentSearch) params.search = currentSearch
    if (currentBrand) params.brand = currentBrand
    if (currentCategory) params.category = currentCategory
    if (currentSort) params.sort = currentSort
    if (currentFeatured) params.featured = currentFeatured
    if (currentMin) params.minPrice = currentMin
    if (currentMax) params.maxPrice = currentMax
    params.page = currentPage
    params.limit = 12
    dispatch(fetchProducts(params))
  }, [dispatch, currentSearch, currentBrand, currentCategory, currentSort, currentFeatured, currentPage, currentMin, currentMax])

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data || [])).catch(() => setCategories([]))
  }, [])

  const setParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasFilters = currentSearch || currentBrand || currentCategory || currentFeatured || currentMin || currentMax

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brown-dark">
            {currentSearch ? `Results for "${currentSearch}"` : currentBrand || 'All Phones'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">{total} products found</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input !py-2 !pr-8 appearance-none text-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors
              ${filterOpen || hasFilters ? 'bg-brown text-white border-brown' : 'bg-white border-cream-300 text-stone-700 hover:border-brown-light'}`}
          >
            <FiFilter className="w-4 h-4" />
            Filters {hasFilters && '•'}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="bg-white rounded-2xl border border-cream-200 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category filter */}
            <div>
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setParam('category', currentCategory === category._id ? '' : category._id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium
                      ${currentCategory === category._id ? 'bg-brown text-white border-brown'
                        : 'bg-cream-50 text-stone-600 border-cream-300 hover:border-brown-light'}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Min Price (₹)</p>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={currentMin}
                onChange={(e) => setParam('minPrice', e.target.value)}
                className="input !py-1.5 text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Max Price (₹)</p>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={currentMax}
                onChange={(e) => setParam('maxPrice', e.target.value)}
                className="input !py-1.5 text-sm"
              />
            </div>

            {/* Featured */}
            <div>
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Type</p>
              <button
                onClick={() => setParam('featured', currentFeatured ? '' : 'true')}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
                  ${currentFeatured ? 'bg-brown text-white border-brown'
                    : 'bg-cream-50 text-stone-600 border-cream-300 hover:border-brown-light'}`}
              >
                ⭐ Featured Only
              </button>
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <FiX className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold text-stone-700 mb-2">No products found</h3>
          <p className="text-stone-500 text-sm mb-4">Try adjusting your filters or search query</p>
          <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setParam('page', currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-cream-300 text-stone-700 hover:border-brown-light disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          {[...Array(pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setParam('page', i + 1)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors
                ${currentPage === i + 1 ? 'bg-brown text-white' : 'bg-white border border-cream-300 text-stone-700 hover:border-brown-light'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setParam('page', currentPage + 1)}
            disabled={currentPage === pages}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-cream-300 text-stone-700 hover:border-brown-light disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
