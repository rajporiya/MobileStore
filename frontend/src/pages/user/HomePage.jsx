import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi'
import { fetchFeaturedProducts } from '../../store/slices/productSlice'
import ProductCard from '../../components/user/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeletons'
import api from '../../services/api'

const features = [
  { icon: FiTruck, title: 'Free Delivery', desc: 'On qualifying orders' },
  { icon: FiShield, title: 'Secure Payments', desc: 'Protected checkout' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: 'Simple return process' },
  { icon: FiHeadphones, title: 'Support', desc: 'Here when you need us' },
]

export default function HomePage() {
  const dispatch = useDispatch()
  const { featured, loading } = useSelector((s) => s.products)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    dispatch(fetchFeaturedProducts())
    api.get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]))
  }, [dispatch])

  return (
    <div>
      <section className="relative bg-gradient-to-br from-brown-dark via-brown to-brown-light overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" /><div className="absolute bottom-10 right-20 w-60 h-60 bg-white rounded-full blur-3xl" /></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-brown-light/30 text-cream-100 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">Mobile Lifestyle Destination</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">Mobile<br /><span className="text-primary-300">Store</span></h1>
              <p className="text-cream-200 text-base md:text-lg mb-8 max-w-md leading-relaxed">Browse products, categories, prices, and availability managed directly from your store dashboard.</p>
              <div className="flex flex-wrap gap-3"><Link to="/products" className="bg-white text-brown-dark font-bold px-6 py-3 rounded-xl hover:bg-cream-100 transition-colors flex items-center gap-2 text-sm">Shop Now <FiArrowRight className="w-4 h-4" /></Link><Link to="/products?featured=true" className="border-2 border-cream-200 text-cream-100 font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm">Featured Phones</Link></div>
              <div className="flex flex-wrap gap-2 mt-8">{categories.slice(0, 4).map((category) => <span key={category._id} className="bg-white/15 text-white text-xs px-3 py-1 rounded-full border border-white/20">{category.name}</span>)}</div>
            </div>
            <div className="hidden md:flex justify-center items-center"><div className="w-64 h-64 bg-white/10 rounded-3xl border border-white/20 flex items-center justify-center text-7xl">Phone</div></div>
          </div>
        </div>
      </section>
      <section className="bg-white border-b border-cream-200"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{features.map(({ icon: Icon, title, desc }) => <div key={title} className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-brown" /></div><div><p className="font-semibold text-stone-800 text-sm">{title}</p><p className="text-stone-500 text-xs">{desc}</p></div></div>)}</div></div></section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><h2 className="section-title">Shop by Category</h2><p className="section-subtitle">Categories are managed in the admin panel</p><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 md:gap-4">{categories.map((category) => <Link key={category._id} to={`/products?category=${category._id}`} className="bg-gradient-to-br from-cream-50 to-primary-100 rounded-2xl p-4 text-center hover:shadow-md transition-all duration-300 group hover:-translate-y-1"><div className="text-3xl mb-2">{category.icon || 'Category'}</div><p className="text-xs font-semibold text-stone-700 group-hover:text-brown transition-colors">{category.name}</p></Link>)}</div></section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16"><div className="flex items-center justify-between mb-8"><div><h2 className="text-2xl md:text-3xl font-bold text-brown-dark">Featured Products</h2><p className="text-stone-500 text-sm mt-1">Products selected in the admin panel</p></div><Link to="/products?featured=true" className="btn-outline !py-2 !px-4 text-sm flex items-center gap-1.5">View All <FiArrowRight className="w-3.5 h-3.5" /></Link></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">{loading ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />) : featured.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)}</div></section>
    </div>
  )
}
