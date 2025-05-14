import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-9xl font-bold text-primary-600 dark:text-primary-400">
            404
          </div>
        </motion.div>
        
        <motion.h1
          className="mt-4 text-3xl font-bold text-gray-900 dark:text-white"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Page non trouvée
        </motion.h1>
        
        <motion.p 
          className="mt-6 text-lg text-gray-600 dark:text-gray-400"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </motion.p>
        
        <motion.div 
          className="mt-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link 
            to="/" 
            className="btn-primary px-6 py-3"
          >
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound