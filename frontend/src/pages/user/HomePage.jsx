import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiStar } from 'react-icons/fi'
import { fetchFeaturedProducts, fetchCategories, fetchLatestProducts } from '../../store/slices/productSlice'
import ProductCard from '../../components/user/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeletons'

const features = [
  { icon: FiTruck, title: 'Free Delivery', desc: 'On qualifying orders', color: 'from-indigo-500 to-blue-500' },
  { icon: FiShield, title: 'Secure Payments', desc: 'Protected checkout', color: 'from-emerald-500 to-teal-500' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: 'Simple return process', color: 'from-amber-500 to-orange-500' },
  { icon: FiHeadphones, title: '24/7 Support', desc: 'Here when you need us', color: 'from-fuchsia-500 to-pink-500' },
]

export default function HomePage() {
  const dispatch = useDispatch()
  const { featured, latest, categories, featuredLoaded } = useSelector((s) => s.products)
  const { userInfo } = useSelector((s) => s.auth)

  // Data lives in redux and is cached between visits: it renders instantly
  // from cache and quietly refreshes in the background, so nothing flashes.
  useEffect(() => {
    dispatch(fetchFeaturedProducts())
    dispatch(fetchCategories())
    dispatch(fetchLatestProducts())
  }, [dispatch])

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-fuchsia-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-300 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-64 h-64 bg-violet-300 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider border border-white/20 backdrop-blur">
                <span className="w-1.5 h-1.5 bg-fuchsia-300 rounded-full animate-pulse" /> Mobile Lifestyle Destination
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                Volt<br />
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">Cart</span>
              </h1>
              <p className="text-indigo-100 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                Browse products, categories, prices, and availability managed directly from your store dashboard.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="bg-white text-indigo-700 font-bold px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-900/20 flex items-center gap-2 text-sm">
                  Shop Now <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/products?featured=true" className="border-2 border-white/25 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm">
                  Featured Phones
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 mt-9">
                {categories.slice(0, 4).map((category) => (
                  <Link key={category._id} to={`/products?category=${category._id}`} className="bg-white/10 text-white text-xs px-3.5 py-1.5 rounded-full border border-white/20 hover:bg-white/20 transition-colors backdrop-blur">
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="hidden lg:flex justify-center items-center relative">
              <div className="relative w-72 rounded-[2.5rem] bg-gradient-to-b from-white/25 to-white/5 border border-white/30 backdrop-blur-xl p-3 shadow-2xl shadow-indigo-900/40">
                <div className="rounded-[2rem] bg-white p-3">
                  <div className="rounded-[1.6rem] bg-gradient-to-b from-slate-100 to-slate-50 flex flex-col items-center justify-center gap-3 py-12">
                    <span className="text-7xl">📱</span>
                    <div className="h-1.5 w-16 bg-slate-300 rounded-full" />
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -left-10 top-14 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <FiStar className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none">4.9</p>
                    <p className="text-[10px] text-slate-500">Top rated</p>
                  </div>
                </div>
                <div className="absolute -right-8 bottom-16 bg-white rounded-2xl shadow-xl px-4 py-3 animate-bounce" style={{ animationDuration: '4s' }}>
                  <p className="text-sm font-bold text-emerald-600 leading-none">20% OFF</p>
                  <p className="text-[10px] text-slate-500">Limited time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-center gap-3 group">
                <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="section-title">Shop by Category</h2>
        <p className="section-subtitle">Categories are managed in the admin panel</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
          {categories.slice(0, 7).map((category) => (
            <Link key={category._id} to={`/products?category=${category._id}`}
              className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-card hover:shadow-card-hover transition-all duration-300 group hover:-translate-y-1.5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-2xl group-hover:from-indigo-500 group-hover:to-violet-500 transition-colors duration-300">
                <span className="group-hover:scale-110 transition-transform">{category.icon || '📱'}</span>
              </div>
              <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 md:py-12 md:pb-20">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Featured Products</h2>
            <p className="text-slate-500 text-sm mt-1">Products selected in the admin panel</p>
          </div>
          <Link to="/products?featured=true" className="btn-outline !py-2 !px-4 text-sm flex items-center gap-1.5 shrink-0">
            View All <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {!featuredLoaded
            ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>

      {/* Latest Phones — every phone an admin publishes shows up here first */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">New Arrivals</h2>
            <p className="text-slate-500 text-sm mt-1">The latest phones added to the store</p>
          </div>
          <Link to="/products" className="btn-outline !py-2 !px-4 text-sm flex items-center gap-1.5 shrink-0">
            View All <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {latest.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>

      {/* Sell Old Phone CTA — shoppers only, staff never sell to us */}
      {userInfo?.role === 'user' && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-3xl overflow-hidden p-8 md:p-12">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '26px 26px' }} />
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
                {categories.length > 0 ? `Trusted by ${categories.length}+ categories` : 'Upgrade your phone'}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
                Sell Your Old Phone<br />Get the Best Price
              </h2>
              <p className="text-indigo-100 text-sm md:text-base mb-6 max-w-md">
                Upload a few photos, pick a dealer near you, and get a free quote. Cash in hand — old phone collected from your doorstep.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/sell-mobile" className="bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all hover:-translate-y-0.5 shadow-xl text-sm flex items-center gap-2">
                  Sell Old Phone <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-end text-8xl drop-shadow-2xl">📱</div>
          </div>
        </div>
      </section>
      )}
    </div>
  )
}
