import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

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
import VerifyEmail from './pages/auth/VerifyEmail'
import VerifyPhone from './pages/auth/VerifyPhone'
import VerificationPending from './pages/auth/VerificationPending'
import Profile from './pages/profile/Profile'
import NotFound from './pages/NotFound'
import VerifyPage from './pages/VerifyPage'
import Hello from './components/Hello';

// Dashboard Pages
import UserDashboard from './pages/dashboard/UserDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import AddUser from './pages/admin/AddUser'
import LogManagement from './pages/admin/LogManagement'

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
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Routes publiques avec MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/verify" element={<VerifyPage />} />
          </Route>

          {/* Routes d'authentification avec AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/verification-pending" element={<VerificationPending />} />
          </Route>

          {/* Routes protégées dans le DashboardLayout */}
          <Route element={<DashboardLayout />}>
            {/* Route de vérification du téléphone (nécessite authentification) */}
            <Route 
              path="/verify-phone" 
              element={
                <ProtectedRoute>
                  <VerifyPhone />
                </ProtectedRoute>
              }
            />
            
            {/* Routes protégées utilisateur */}
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
             

            {/* Routes protégées administrateur */}
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
                  <LogManagement />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/users/add" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AddUser />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/logs" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <LogManagement />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Route pour les chemins non définis */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App