// src/pages/admin/AddUser.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userService } from '../../services/api';
import { ROUTES } from '../../config/config';
import toast from 'react-hot-toast';

const AddUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'user',
    phone: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const navigate = useNavigate();

  // Vérifier la force du mot de passe
  const checkPasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length > 5) strength += 1;
    if (password.length > 9) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  // Gérer les changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mettre à jour la valeur du champ
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur associée au champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Vérifier la force du mot de passe
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
    
    // Vérifier la correspondance des mots de passe
    if (name === 'password' || name === 'passwordConfirm') {
      if (
        (name === 'password' && formData.passwordConfirm && value !== formData.passwordConfirm) ||
        (name === 'passwordConfirm' && value !== formData.password)
      ) {
        setFormErrors(prev => ({
          ...prev,
          passwordConfirm: 'Les mots de passe ne correspondent pas'
        }));
      } else if (formData.passwordConfirm || name === 'passwordConfirm') {
        setFormErrors(prev => ({
          ...prev,
          passwordConfirm: null
        }));
      }
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};
    
    // Validation du nom
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    } else if (formData.name.length < 2) {
      errors.name = 'Le nom doit comporter au moins 2 caractères';
    }
    
    // Validation de l'email
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Veuillez fournir une adresse email valide';
    }
    
    // Validation du mot de passe
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit comporter au moins 8 caractères';
    } else if (passwordStrength < 3) {
      errors.password = 'Le mot de passe doit être plus fort';
    }
    
    // Validation de la confirmation du mot de passe
    if (!formData.passwordConfirm) {
      errors.passwordConfirm = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Les mots de passe ne correspondent pas';
    }
    
    // Validation du téléphone (facultatif)
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone)) {
      errors.phone = 'Le format du numéro de téléphone est invalide';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await userService.createUser(formData);
      toast.success('Utilisateur créé avec succès');
      navigate(ROUTES.ADMIN_USERS);
    } catch (error) {
      // Vérifier si l'erreur est liée à la validation
      if (error.response?.data?.error) {
        // Détecter les erreurs spécifiques
        const errorMessage = error.response.data.error;
        
        if (errorMessage.includes('email')) {
          setFormErrors(prev => ({
            ...prev,
            email: 'Cet email est déjà utilisé'
          }));
        } else if (errorMessage.includes('téléphone')) {
          setFormErrors(prev => ({
            ...prev,
            phone: 'Ce numéro de téléphone est déjà utilisé'
          }));
        } else {
          // Erreur générique
          toast.error(errorMessage);
        }
      } else {
        toast.error('Une erreur est survenue lors de la création de l\'utilisateur');
      }
      
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Ajouter un utilisateur
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Créez un nouvel utilisateur dans le système
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${formErrors.name ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
              placeholder="John Doe"
              disabled={isSubmitting}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse e-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${formErrors.email ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
              placeholder="exemple@domaine.com"
              disabled={isSubmitting}
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                  ${formErrors.password ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
            )}
            {/* Indicateur de force du mot de passe */}
            {formData.password && (
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
                  Utilisez au moins 8 caractères avec des majuscules, des chiffres et des caractères spéciaux
                </p>
              </div>
            )}
          </div>

          {/* Confirmation du mot de passe */}
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${formErrors.passwordConfirm ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            {formErrors.passwordConfirm && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.passwordConfirm}</p>
            )}
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rôle
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <input
                  type="radio"
                  id="role-user"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={handleChange}
                  className="hidden peer"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="role-user"
                  className="flex items-center justify-center p-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 peer-checked:text-primary-600 dark:peer-checked:text-primary-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Utilisateur</span>
                  </div>
                </label>
              </div>
              
              <div>
                <input
                  type="radio"
                  id="role-admin"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                  className="hidden peer"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="role-admin"
                  className="flex items-center justify-center p-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 peer-checked:text-primary-600 dark:peer-checked:text-primary-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="font-medium">Administrateur</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Téléphone (optionnel) */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numéro de téléphone (optionnel)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${formErrors.phone ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900' : 'border-gray-300 focus:ring-primary-200 dark:focus:ring-primary-900'}`}
              placeholder="+33612345678"
              disabled={isSubmitting}
            />
            {formErrors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Format international recommandé (+33XXXXXXXXX)
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </div>
              ) : (
                'Créer l\'utilisateur'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddUser;