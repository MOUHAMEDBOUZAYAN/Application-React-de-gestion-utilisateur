// pages/profile/PasswordUpdate.jsx - Composant pour changer le mot de passe
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const PasswordUpdate = () => {
  const { updatePassword, error, clearErrors, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Effacer l'erreur du champ modifié
    setFormErrors({
      ...formErrors,
      [name]: ''
    });
    
    // Effacer les erreurs globales du store
    if (error) {
      clearErrors();
    }
  };
  
  const validateForm = () => {
    let isValid = true;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    };
    
    // Validation du mot de passe actuel
    if (!formData.currentPassword.trim()) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
      isValid = false;
    }
    
    // Validation du nouveau mot de passe
    if (!formData.newPassword.trim()) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }
    
    // Validation de la confirmation du mot de passe
    if (!formData.confirmNewPassword.trim()) {
      errors.confirmNewPassword = 'La confirmation du mot de passe est requise';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      errors.confirmNewPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Préparer les données pour l'API dans le format attendu par le backend
    const passwordData = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      passwordConfirm: formData.confirmNewPassword // Assurez-vous que ce nom correspond à ce que le backend attend
    };
    
    const success = await updatePassword(passwordData);
    
    if (success) {
      // Réinitialiser le formulaire après la mise à jour
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      
      toast.success('Votre mot de passe a été mis à jour avec succès!');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mot de passe actuel */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${formErrors.currentPassword ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
              placeholder="Entrez votre mot de passe actuel"
            />
            {formErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.currentPassword}</p>
            )}
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${formErrors.newPassword ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
              placeholder="Entrez votre nouveau mot de passe"
            />
            {formErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.newPassword}</p>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Le mot de passe doit contenir au moins 6 caractères
          </p>
        </div>

        {/* Confirmation du nouveau mot de passe */}
        <div>
          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${formErrors.confirmNewPassword ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
              placeholder="Confirmez votre nouveau mot de passe"
            />
            {formErrors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.confirmNewPassword}</p>
            )}
          </div>
        </div>

        {/* Affichage des erreurs globales */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement...
              </span>
            ) : (
              'Mettre à jour le mot de passe'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PasswordUpdate;