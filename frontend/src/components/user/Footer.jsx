import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiYoutube } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-brown-dark text-cream-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brown-light rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="text-lg font-bold text-white">Mobile_Store</span>
            </div>
            <p className="text-cream-300 text-sm leading-relaxed mb-4">
              Your complete mobile lifestyle destination. Premium phones from top brands with best prices guaranteed.
            </p>
            <div className="flex gap-3">
              {[FiInstagram, FiFacebook, FiTwitter, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-brown/50 rounded-lg flex items-center justify-center text-cream-200 hover:bg-brown-light transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[['/', 'Home'], ['/products', 'All Products'], ['/products?featured=true', 'Featured'], ['/cart', 'Cart']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-cream-300 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-white font-semibold mb-4">Top Brands</h3>
            <ul className="space-y-2">
              {['Apple', 'Samsung', 'iQOO', 'MI', 'OPPO', 'VIVO', 'MOTOROLA'].map((brand) => (
                <li key={brand}>
                  <Link to={`/products?brand=${brand}`} className="text-cream-300 hover:text-white text-sm transition-colors">{brand}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-cream-300 text-sm">
                <FiMapPin className="w-4 h-4 mt-0.5 shrink-0" />
                123 Tech Street, Mumbai, India 400001
              </li>
              <li className="flex items-center gap-2 text-cream-300 text-sm">
                <FiPhone className="w-4 h-4 shrink-0" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-cream-300 text-sm">
                <FiMail className="w-4 h-4 shrink-0" />
                hello@mobilestore.in
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brown/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-cream-300 text-xs">© {new Date().getFullYear()} Mobile_Store. All rights reserved.</p>
          <p className="text-cream-300 text-xs">Built with ❤️ for mobile lovers</p>
        </div>
      </div>
    </footer>
  )
}
