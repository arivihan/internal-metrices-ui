import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '@/signals/auth'

const ProtectedRoute = () => {
  if (!isAuthenticated.value) {
    return <Navigate to='/login' replace />
  }

  return <Outlet />
}

export default ProtectedRoute
