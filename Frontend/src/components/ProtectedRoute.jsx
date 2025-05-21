import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingScreen from './LoadingScreen'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Si l'utilisateur n'est pas authentifié, vérifier à nouveau
    if (!isAuthenticated) {
      checkAuth()
    }
  }, [isAuthenticated, checkAuth])

  // Afficher un écran de chargement pendant la vérification
  if (isLoading) {
    return <LoadingScreen />
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  

  // Rediriger vers /verify si l'utilisateur n'est pas vérifié
  if (user && !user.isEmailVerified && !user.isPhoneVerified) {
    return <Navigate to="/verify" replace />;
  }

  // Si la route est réservée aux administrateurs et que l'utilisateur n'est pas admin
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Si tout est OK, rendre le composant enfant
  return children
}

export default ProtectedRoute