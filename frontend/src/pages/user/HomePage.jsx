import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi'
import { fetchFeaturedProducts } from '../../store/slices/productSlice'
import ProductCard from '../../components/user/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeletons'

const BRANDS = [
  { name: 'Apple', emoji: '🍎', color: 'from-slate-100 to-slate-200' },
  { name: 'Samsung', emoji: '🌟', color: 'from-blue-50 to-blue-100' },
  { name: 'iQOO', emoji: '⚡', color: 'from-purple-50 to-purple-100' },
  { name: 'MI', emoji: '🔥', color: 'from-orange-50 to-orange-100' },
  { name: 'OPPO', emoji: '📸', color: 'from-green-50 to-green-100' },
  { name: 'VIVO', emoji: '🎵', color: 'from-pink-50 to-pink-100' },
  { name: 'MOTOROLA', emoji: '📱', color: 'from-red-50 to-red-100' },
]

const FEATURES = [
  { icon: FiTruck, title: 'Free Delivery', desc: 'On orders above ₹999' },
  { icon: FiShield, title: 'Secure Payments', desc: 'Razorpay & Stripe secured' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: FiHeadphones, title: '24/7 Support', desc: 'Always here for you' },
]

export default function HomePage() {
  const dispatch = useDispatch()
  const { featured, loading } = useSelector((s) => s.products)

  useEffect(() => {
    dispatch(fetchFeaturedProducts())
  }, [dispatch])

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-brown-dark via-brown to-brown-light overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-brown-light/30 text-cream-100 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                Complete Mobile Lifestyle Destination
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
                Mobile<br />
                <span className="text-primary-300">Store</span>
              </h1>
              <p className="text-cream-200 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                Discover the latest smartphones from Apple, Samsung, iQOO, MI, OPPO, VIVO, and more — all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="bg-white text-brown-dark font-bold px-6 py-3 rounded-xl hover:bg-cream-100 transition-colors flex items-center gap-2 text-sm">
                  Shop Now <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/products?featured=true" className="border-2 border-cream-200 text-cream-100 font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm">
                  Featured Phones
                </Link>
              </div>
              {/* Brand pills */}
              <div className="flex flex-wrap gap-2 mt-8">
                {['Apple', 'Samsung', 'Pixel', 'OnePlus'].map((b) => (
                  <span key={b} className="bg-white/15 text-white text-xs px-3 py-1 rounded-full border border-white/20">{b}</span>
                ))}
              </div>
            </div>
            <div className="hidden md:flex justify-center items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"
                alt="Featured Phone"
                className="w-48 h-auto rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
              />
              <img
                src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"
                alt="Featured Phone 2"
                className="w-48 h-auto rounded-3xl shadow-2xl -rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-white border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brown" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{title}</p>
                  <p className="text-stone-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="section-title">Shop by Brand</h2>
        <p className="section-subtitle">Explore your favourite mobile brand</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 md:gap-4">
          {BRANDS.map(({ name, emoji, color }) => (
            <Link
              key={name}
              to={`/products?brand=${name}`}
              className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-center hover:shadow-md transition-all duration-300 group hover:-translate-y-1`}
            >
              <div className="text-3xl mb-2">{emoji}</div>
              <p className="text-xs font-semibold text-stone-700 group-hover:text-brown transition-colors">{name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-brown-dark">Featured Products</h2>
            <p className="text-stone-500 text-sm mt-1">Handpicked best sellers just for you</p>
          </div>
          <Link to="/products?featured=true" className="btn-outline !py-2 !px-4 text-sm flex items-center gap-1.5">
            View All <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
          }
        </div>
      </section>

      {/* Banner CTA */}
      <section className="bg-gradient-to-r from-primary-100 to-cream-200 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-brown-dark mb-3">
            Get the Latest Smartphones at Best Prices
          </h2>
          <p className="text-stone-600 mb-6">Free delivery | EMI available | 7-day easy returns</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
            Explore All Phones <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  )
}
