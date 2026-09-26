import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { PageLoader } from './Skeletons'

export default function CustomerRoute({ children }) {
  const { userInfo, loading } = useSelector((s) => s.auth)

  if (loading) return <PageLoader />
  if (!userInfo) return <Navigate to="/login" replace />
  if (userInfo.role !== 'user') return <Navigate to="/" replace />

  return children
}
