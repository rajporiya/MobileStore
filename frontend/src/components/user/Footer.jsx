import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiArrowUpRight } from 'react-icons/fi'

const socials = [
  { icon: FiInstagram, label: 'Instagram' },
  { icon: FiFacebook, label: 'Facebook' },
  { icon: FiTwitter, label: 'Twitter' },
  { icon: FiYoutube, label: 'YouTube' },
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16 relative">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white text-sm font-extrabold">V</span>
              </div>
              <span className="text-lg font-extrabold text-white">VoltCart</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Your complete mobile lifestyle destination. Premium phones from top brands with best prices guaranteed.
            </p>
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-gradient-to-br hover:from-indigo-600 hover:to-violet-600 transition-all hover:-translate-y-0.5">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              {[['/', 'Home'], ['/products', 'All Products'], ['/products?featured=true', 'Featured'], ['/cart', 'Cart'], ['/wishlist', 'Wishlist']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="group inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
                    {label}
                    <FiArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Top Brands</h3>
            <ul className="space-y-3">
              {['Apple', 'Samsung', 'iQOO', 'MI', 'OPPO', 'VIVO', 'MOTOROLA'].map((brand) => (
                <li key={brand}>
                  <Link to={`/products?brand=${brand}`} className="group inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
                    {brand}
                    <FiArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-400 text-sm">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <FiMapPin className="w-4 h-4 text-indigo-400" />
                </div>
                123 Tech Street, Mumbai, India 400001
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <FiPhone className="w-4 h-4 text-indigo-400" />
                </div>
                +91 98765 43210
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <FiMail className="w-4 h-4 text-indigo-400" />
                </div>
                hello@mobilestore.in
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-500 text-xs">© {new Date().getFullYear()} VoltCart. All rights reserved.</p>
          <p className="text-slate-500 text-xs">Built with <span className="text-rose-400">❤</span> for mobile lovers</p>
        </div>
      </div>
    </footer>
  )
}