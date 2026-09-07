import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ children }) {
  const { userInfo } = useSelector((s) => s.auth)
  return userInfo ? children : <Navigate to="/login" replace />
}
