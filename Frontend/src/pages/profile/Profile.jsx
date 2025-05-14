import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import ProfileInfo from './components/ProfileInfo'
import ChangePassword from './components/ChangePassword'
import AccountSecurity from './components/AccountSecurity'

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useAuthStore()
  
  // Animation variants
  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.4
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du profil...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <motion.h1 
        className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Profil Utilisateur
      </motion.h1>
      
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-8">
        <button
          className={`mr-2 py-2 px-4 font-medium rounded-t-lg ${
            activeTab === 'profile'
              ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Informations Personnelles
        </button>
        <button
          className={`mr-2 py-2 px-4 font-medium rounded-t-lg ${
            activeTab === 'password'
              ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('password')}
        >
          Changer le Mot de Passe
        </button>
        <button
          className={`py-2 px-4 font-medium rounded-t-lg ${
            activeTab === 'security'
              ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('security')}
        >
          Sécurité du Compte
        </button>
      </div>
      
      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={tabVariants}
      >
        {activeTab === 'profile' && <ProfileInfo user={user} />}
        {activeTab === 'password' && <ChangePassword />}
        {activeTab === 'security' && <AccountSecurity user={user} />}
      </motion.div>
    </div>
  )
}

export default Profile