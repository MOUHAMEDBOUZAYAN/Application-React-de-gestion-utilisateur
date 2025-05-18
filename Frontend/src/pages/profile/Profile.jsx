// src/pages/profile/Profile.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

// Composants d'onglets
import ProfileInfo from './components/ProfileInfo';
import ChangePassword from './components/ChangePassword';
import AccountSecurity from './components/AccountSecurity';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Utiliser le paramètre d'URL pour définir l'onglet actif
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    if (tab && ['profile', 'password', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Changer d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const tabContent = {
    profile: <ProfileInfo user={user} onChangeTab={handleTabChange} />,
    password: <ChangePassword />,
    security: <AccountSecurity user={user} />
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Mon profil
        </h2>

        {/* Onglets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleTabChange('profile')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Informations
            </button>
            <button
              onClick={() => handleTabChange('password')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'password'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Mot de passe
            </button>
            <button
              onClick={() => handleTabChange('security')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'security'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Sécurité
            </button>
          </div>
        </div>

        {/* Contenu de l'onglet actif */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {tabContent[activeTab]}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;