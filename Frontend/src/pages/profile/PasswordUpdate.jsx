// src/pages/profile/components/PasswordUpdate.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { calculatePasswordStrength } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PasswordUpdate = () => {
  const { updatePassword, isLoading, error, clearErrors } = useAuthStore();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    passwordConfirm: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  
  // Effacer les erreurs au montage du composant
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);
  
  // Vérifier la force du mot de passe
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.newPassword);
    setPasswordStrength(strength);
    
    // Vérifier si les mots de passe correspondent
    if (formData.passwordConfirm) {
      setPasswordsMatch(formData.newPassword === formData.passwordConfirm);
    }
  }, [formData.newPassword, formData.passwordConfirm]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs
    if (!formData.currentPassword) {
      toast.error('Le mot de passe actuel est requis');
      return;
    }
    
    if (!formData.newPassword) {
      toast.error('Le nouveau mot de passe est requis');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      toast.error('Le mot de passe doit comporter au moins 8 caractères');
      return;
    }
    
    if (passwordStrength < 3) {
      toast.error('Le mot de passe n\'est pas assez fort');
      return;
    }
    
    if (!passwordsMatch) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    const success = await updatePassword(formData);
    if (success) {
      // Réinitialiser le formulaire
      setFormData({
        currentPassword: '',
        newPassword: '',
        passwordConfirm: ''
      });
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Modifier votre mot de passe
      </h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mot de passe actuel */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
          </div>
        </div>
        
        {/* Nouveau mot de passe */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
          </div>
          
          {/* Indicateur de force du mot de passe */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      passwordStrength <= 1
                        ? 'bg-red-500'
                        : passwordStrength < 4
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, passwordStrength * 20)}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  {passwordStrength <= 1
                    ? 'Faible'
                    : passwordStrength < 4
                      ? 'Moyen'
                      : 'Fort'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Utilisez au moins 8 caractères, avec des majuscules, des chiffres et des caractères spéciaux.
              </p>
            </div>
          )}
        </div>
        
        {/* Confirmation du mot de passe */}
        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={`block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:outline-none dark:bg-gray-700 dark:text-white
                ${formData.passwordConfirm && !passwordsMatch
                  ? 'border-red-500 focus:border-red-500 dark:border-red-500'
                  : 'border-gray-300 focus:border-primary-500 dark:border-gray-600'}`}
              disabled={isLoading}
            />
          </div>
          
          {formData.passwordConfirm && !passwordsMatch && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              Les mots de passe ne correspondent pas
            </p>
          )}
        </div>
        
        {/* Afficher les mots de passe */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showPasswords"
            checked={showPasswords}
            onChange={() => setShowPasswords(!showPasswords)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="showPasswords" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Afficher les mots de passe
          </label>
        </div>
        
        {/* Bouton de soumission */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.passwordConfirm || !passwordsMatch || passwordStrength < 2}
          >
            {isLoading ? 'Mise à jour en cours...' : 'Mettre à jour le mot de passe'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PasswordUpdate;