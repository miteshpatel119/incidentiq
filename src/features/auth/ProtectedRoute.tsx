import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'

export function ProtectedRoute(): JSX.Element {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  return isAuthenticated ? <Outlet /> : <Navigate replace state={{ from: location }} to="/login" />
}
