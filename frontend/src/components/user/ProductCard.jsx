import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiShoppingCart, FiHeart, FiStar, FiCheck, FiRepeat } from 'react-icons/fi'
import { addToCart } from '../../store/slices/cartSlice'
import { toggleWishlist } from '../../store/slices/wishlistSlice'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const { userInfo } = useSelector((s) => s.auth)
  const wishlistItems = useSelector((s) => s.wishlist.items)
  const [added, setAdded] = useState(false)

  const isWishlisted = wishlistItems.some((item) =>
    (item._id || item) === product._id
  )

  const handleAddToCart = (e) => {
    e.preventDefault()
    dispatch(addToCart(product))
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
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
      <div className="relative bg-slate-100 aspect-square overflow-hidden">
        <img
          src={product.images?.[0]?.url || 'https://placehold.co/300x300/f1f5f9/4f46e5?text=Phone'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/0 to-transparent pointer-events-none" />
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-slate-900 text-white font-semibold text-xs px-4 py-1.5 rounded-full shadow-lg">Out of Stock</span>
          </div>
        )}
        {product.exchangeEnabled && product.stock > 0 && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
            <FiRepeat className="w-3 h-3" /> Exchange
          </span>
        )}
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90
            ${isWishlisted ? 'bg-rose-500 text-white scale-110' : 'bg-white/90 backdrop-blur text-slate-500 hover:text-rose-500 hover:bg-white'}`}
        >
          <FiHeart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">{product.brand}</p>
        </div>
        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {product.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                className={`w-3 h-3 ${star <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400">({product.numReviews || 0})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-extrabold text-slate-900">
            ₹{product.price?.toLocaleString('en-IN')}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-slate-400 line-through">
              ₹{product.originalPrice?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
            added
              ? 'bg-emerald-500 text-white shadow-emerald-500/25'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/25'
          }`}
        >
          {added ? <FiCheck className="w-4 h-4" /> : <FiShoppingCart className="w-4 h-4" />}
          {product.stock === 0 ? 'Out of Stock' : added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}