// src/pages/profile/components/ProfileInfo.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

const ProfileInfo = () => {
  const { user, updateProfile, isLoading, error, clearErrors } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Charger les données de l'utilisateur
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);
  
  // Effacer les erreurs au montage du composant
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation de base
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Informations personnelles
        </h3>
        
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Modifier
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                {formData.name || 'Non spécifié'}
              </div>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse e-mail
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                {formData.email || 'Non spécifié'}
              </div>
            )}
            {isEditing && (
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                La modification de l'email nécessitera une confirmation par email.
              </p>
            )}
          </div>
          
          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numéro de téléphone
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="+33612345678"
                disabled={isLoading}
              />
            ) : (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">
                {formData.phone || 'Non spécifié'}
              </div>
            )}
            {isEditing && (
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                La modification du téléphone nécessitera une confirmation par SMS.
              </p>
            )}
          </div>
          
          {/* Boutons d'action */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Rétablir les données d'origine
                  if (user) {
                    setFormData({
                      name: user.name || '',
                      email: user.email || '',
                      phone: user.phone || ''
                    });
                  }
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default ProfileInfo;