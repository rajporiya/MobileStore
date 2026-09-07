import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiShoppingCart, FiHeart, FiStar } from 'react-icons/fi'
import { addToCart } from '../../store/slices/cartSlice'
import { toggleWishlist } from '../../store/slices/wishlistSlice'

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const { userInfo } = useSelector((s) => s.auth)
  const wishlistItems = useSelector((s) => s.wishlist.items)

  const isWishlisted = wishlistItems.some((item) =>
    (item._id || item) === product._id
  )

  const handleAddToCart = (e) => {
    e.preventDefault()
    dispatch(addToCart(product))
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    if (!userInfo) return
    dispatch(toggleWishlist(product._id))
  }

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount || 0

  return (
    <Link to={`/products/${product._id}`} className="card group block overflow-hidden">
      {/* Image */}
      <div className="relative bg-cream-100 aspect-square overflow-hidden">
        <img
          src={product.images?.[0]?.url || 'https://placehold.co/300x300/faf3e8/8B5E3C?text=Phone'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-stone-700 font-semibold text-sm px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all
            ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-stone-500 hover:text-red-500'}`}
        >
          <FiHeart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-brown-light font-semibold uppercase tracking-wider mb-1">{product.brand}</p>
        <h3 className="font-semibold text-stone-800 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-brown transition-colors">
          {product.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                className={`w-3 h-3 ${star <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
              />
            ))}
          </div>
          <span className="text-xs text-stone-500">({product.numReviews || 0})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-brown-dark">
            ₹{product.price?.toLocaleString('en-IN')}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-stone-400 line-through">
              ₹{product.originalPrice?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full flex items-center justify-center gap-2 bg-brown text-white py-2 rounded-xl text-sm font-medium
                     hover:bg-brown-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <FiShoppingCart className="w-4 h-4" />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}
