import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiHeart } from 'react-icons/fi'
import { fetchWishlist } from '../../store/slices/wishlistSlice'
import ProductCard from '../../components/user/ProductCard'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((s) => s.wishlist)

  useEffect(() => {
    dispatch(fetchWishlist())
  }, [dispatch])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FiHeart className="w-6 h-6 text-brown" />
        <h1 className="text-2xl font-bold text-brown-dark">My Wishlist</h1>
        {items.length > 0 && <span className="badge badge-brown">{items.length} items</span>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brown border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 card">
          <FiHeart className="w-16 h-16 text-stone-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-600 mb-2">Your wishlist is empty</h2>
          <p className="text-stone-400 mb-6">Browse products and save the ones you love.</p>
          <Link to="/products" className="btn-primary inline-block">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
