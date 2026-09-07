import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiShoppingCart, FiHeart, FiStar, FiChevronLeft, FiMinus, FiPlus } from 'react-icons/fi'
import { fetchProductById, clearProduct } from '../../store/slices/productSlice'
import { addToCart } from '../../store/slices/cartSlice'
import { toggleWishlist, fetchWishlist } from '../../store/slices/wishlistSlice'
import { PageLoader } from '../../components/common/Skeletons'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { selectedProduct: product, loading } = useSelector((s) => s.products)
  const { userInfo } = useSelector((s) => s.auth)
  const wishlistItems = useSelector((s) => s.wishlist.items)

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchProductById(id))
    if (userInfo) dispatch(fetchWishlist())
    return () => dispatch(clearProduct())
  }, [dispatch, id, userInfo])

  if (loading || !product) return <PageLoader />

  const isWishlisted = wishlistItems.some((item) => (item._id || item) === product._id)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) dispatch(addToCart(product))
    toast.success(`${quantity} item(s) added to cart!`)
  }

  const handleWishlist = () => {
    if (!userInfo) { navigate('/login'); return }
    dispatch(toggleWishlist(product._id))
    dispatch(fetchWishlist())
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!userInfo) { navigate('/login'); return }
    setReviewLoading(true)
    try {
      await api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      })
      toast.success('Review submitted!')
      setReviewComment('')
      dispatch(fetchProductById(id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setReviewLoading(false)
    }
  }

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-500 hover:text-brown text-sm mb-6 transition-colors">
        <FiChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square bg-cream-100 rounded-2xl overflow-hidden mb-3 border border-cream-200">
            <img
              src={product.images?.[selectedImage]?.url || 'https://placehold.co/600x600/faf3e8/8B5E3C?text=Phone'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all
                    ${selectedImage === i ? 'border-brown shadow-md' : 'border-cream-200 hover:border-brown-light'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <span className="badge badge-brown mb-2">{product.brand}</span>
          {product.category?.name && (
            <span className="badge bg-cream-100 text-stone-600 ml-2">{product.category.name}</span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-brown-dark mt-3 mb-3">{product.title}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar key={star}
                  className={`w-4 h-4 ${star <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-stone-700">{product.rating?.toFixed(1) || 'No rating'}</span>
            <span className="text-sm text-stone-500">({product.numReviews || 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-extrabold text-brown-dark">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.originalPrice > product.price && (
              <span className="text-lg text-stone-400 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
            )}
            {discount > 0 && (
              <span className="badge bg-red-100 text-red-600 font-bold">{discount}% OFF</span>
            )}
          </div>

          {/* Stock */}
          <p className={`text-sm font-medium mb-4 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 0 ? `✓ In Stock (${product.stock} units)` : '✗ Out of Stock'}
          </p>

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium text-stone-700">Quantity:</span>
              <div className="flex items-center gap-2 bg-cream-100 rounded-xl p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-stone-700 hover:bg-cream-200 transition-colors"
                >
                  <FiMinus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-semibold text-stone-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-stone-700 hover:bg-cream-200 transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
            >
              <FiShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleWishlist}
              className={`p-3 rounded-xl border-2 transition-all ${isWishlisted
                ? 'bg-red-500 border-red-500 text-white'
                : 'border-cream-300 text-stone-500 hover:border-red-300 hover:text-red-500 bg-white'}`}
            >
              <FiHeart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Delivery */}
          <div className="bg-cream-50 rounded-xl p-3 text-xs text-stone-600 border border-cream-200">
            🚚 Free delivery on orders above ₹999 · EMI available · 7-day returns
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden mb-8">
        <div className="flex border-b border-cream-200 overflow-x-auto">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold capitalize whitespace-nowrap transition-colors
                ${activeTab === tab ? 'text-brown border-b-2 border-brown bg-primary-50'
                  : 'text-stone-500 hover:text-stone-700'}`}
            >
              {tab} {tab === 'reviews' && `(${product.numReviews || 0})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <p className="text-stone-700 leading-relaxed">{product.description}</p>
          )}

          {activeTab === 'specifications' && (
            <div className="divide-y divide-cream-100">
              {product.specifications?.length > 0
                ? product.specifications.map((spec, i) => (
                    <div key={i} className="flex py-3 gap-4">
                      <span className="w-40 text-sm font-semibold text-stone-600 shrink-0">{spec.key}</span>
                      <span className="text-sm text-stone-700">{spec.value}</span>
                    </div>
                  ))
                : <p className="text-stone-500 text-sm">No specifications available.</p>
              }
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {product.reviews?.length > 0
                ? product.reviews.map((review) => (
                    <div key={review._id} className="bg-cream-50 rounded-xl p-4 border border-cream-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-stone-800 text-sm">{review.name}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FiStar key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-stone-600 text-sm">{review.comment}</p>
                    </div>
                  ))
                : <p className="text-stone-500 text-sm">No reviews yet. Be the first to review!</p>
              }

              {/* Review Form */}
              {userInfo && (
                <form onSubmit={handleReviewSubmit} className="mt-6 bg-primary-50 rounded-xl p-4 border border-cream-200">
                  <h4 className="font-semibold text-stone-800 mb-3">Write a Review</h4>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)}>
                        <FiStar className={`w-6 h-6 transition-colors ${s <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-stone-300 hover:text-amber-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    required
                    className="input resize-none mb-3"
                  />
                  <button type="submit" disabled={reviewLoading} className="btn-primary !py-2 text-sm disabled:opacity-50">
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
