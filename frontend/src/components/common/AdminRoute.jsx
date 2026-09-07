import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AdminRoute({ children }) {
  const { userInfo } = useSelector((s) => s.auth)
  if (!userInfo) return <Navigate to="/admin/login" replace />
  if (userInfo.role !== 'admin') return <Navigate to="/" replace />
  return children
}
