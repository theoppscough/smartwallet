import { Navigate, Outlet } from 'react-router'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser } = useApp()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <Navigate
        to={currentUser.role === 'admin' ? '/admin' : '/dashboard'}
        replace
      />
    )
  }

  return children || <Outlet />
}
