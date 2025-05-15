// pages/profile/Profile.jsx - Composant d'interface du profil
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

// Composants séparés
import PersonalInfo from '../profile/components/ProfileInfo';
import PasswordUpdate from './PasswordUpdate';

const Profile = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  
  // Récupérer l'onglet depuis l'URL si disponible
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);
  
  // Changer d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Mettre à jour l'URL sans recharger la page
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
      >
        {/* En-tête */}
        <div className="p-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white">
          <h1 className="text-2xl font-semibold">Mon Profil</h1>
          <p className="opacity-80">Gérez vos informations et préférences de compte</p>
        </div>
        
        {/* Onglets */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex justify-start overflow-x-auto">
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'personal'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => handleTabChange('personal')}
            >
              Informations Personnelles
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => handleTabChange('password')}
            >
              Changer le Mot de Passe
            </button>
          </nav>
        </div>
        
        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'personal' && <PersonalInfo user={user} />}
          {activeTab === 'password' && <PasswordUpdate />}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;