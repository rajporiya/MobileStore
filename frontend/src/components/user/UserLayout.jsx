import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Navbar from './Navbar'
import Footer from './Footer'
import { fetchWishlist, clearWishlist } from '../../store/slices/wishlistSlice'

export default function UserLayout() {
  const dispatch = useDispatch()
  const { userInfo } = useSelector((s) => s.auth)

  // Load once for the whole app shell so heart icons on every page reflect the
  // current wishlist, and reset it when the user signs out.
  useEffect(() => {
    if (userInfo) dispatch(fetchWishlist())
    else dispatch(clearWishlist())
  }, [dispatch, userInfo])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
