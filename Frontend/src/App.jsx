import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Profile from './pages/profile/Profile'
import NotFound from './pages/NotFound'

// Dashboard Pages
import UserDashboard from './pages/dashboard/UserDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import LoadingScreen from './components/LoadingScreen'

// Store
import { useAuthStore } from './store/authStore'

function App() {
  const location = useLocation()
  const { checkAuth, isLoading } = useAuthStore()
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    const initialCheck = async () => {
      await checkAuth()
      setInitialCheckDone(true)
    }
    initialCheck()
  }, [checkAuth])

  // Afficher un écran de chargement pendant la vérification d'authentification
  if (isLoading && !initialCheckDone) {
    return <LoadingScreen />
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Routes publiques avec MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Routes d'authentification avec AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Routes protégées utilisateur */}
        <Route element={<DashboardLayout />}>
          <Route 
            path="/user/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Routes protégées administrateur */}
        <Route element={<DashboardLayout />}>
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
                {/* Remplacer par votre composant de gestion des utilisateurs une fois créé */}
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
                {/* Remplacer par votre composant de paramètres système une fois créé */}
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App