import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Si l'utilisateur est déjà authentifié, le rediriger vers la page d'accueil
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md mx-auto my-auto p-6">
        {/* Logo et titre */}
        <div className="text-center mb-6">
          <Link to="/">
            <motion.div 
              className="inline-block mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <svg
                  className="h-12 w-12 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </motion.div>
          </Link>
          <motion.h1 
            className="text-3xl font-bold text-gray-900 dark:text-white"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Système d'Authentification
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-300 mt-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Sécurisé et fiable
          </motion.p>
        </div>

        {/* Contenu d'authentification */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8"
        >
          <Outlet />
        </motion.div>

        {/* Pied de page */}
        <motion.div 
          className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          &copy; {new Date().getFullYear()} Système d'Authentification Sécurisée
        </motion.div>
      </div>
    </div>
  )
}

export default AuthLayout