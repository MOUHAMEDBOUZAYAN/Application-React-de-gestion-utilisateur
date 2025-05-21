import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { checkServerStatus } from '../../utils/authUtils'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'user' // Valeur par défaut : user
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [emailError, setEmailError] = useState('') // État pour les erreurs d'email
  const [isServerAvailable, setIsServerAvailable] = useState(true) // Nouvel état pour vérifier la disponibilité du serveur
  
  const { register, isLoading, error, clearErrors, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  
  // Vérifier si le serveur est accessible
  useEffect(() => {
    const verifyServerConnection = async () => {
      const status = await checkServerStatus();
      setIsServerAvailable(status);
      if (!status) {
        toast.error('Impossible de se connecter au serveur. Veuillez vérifier que le serveur backend est démarré et accessible.');
      }
    };
    
    verifyServerConnection();
  }, []);
  
  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated && user) {
      // Rediriger vers le dashboard approprié en fonction du rôle
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/user/dashboard')
      }
    }
  }, [isAuthenticated, user, navigate])
  
  // Nettoyer les erreurs lors du montage du composant
  useEffect(() => {
    clearErrors()
    setEmailError('') // Réinitialiser l'erreur d'email
  }, [clearErrors])
  
  // Surveiller les erreurs venant du store
  useEffect(() => {
    if (error && error.includes("email est déjà utilisé")) {
      setEmailError("Cet email est déjà utilisé. Veuillez vous connecter ou utiliser une autre adresse email.")
    }
  }, [error])
  
  // Vérifier la force du mot de passe
  useEffect(() => {
    const { password } = formData
    let strength = 0
    
    if (password.length > 5) strength += 1
    if (password.length > 9) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
    setPasswordStrength(strength)
    
    // Vérifier si les mots de passe correspondent
    if (formData.passwordConfirm) {
      setPasswordsMatch(formData.password === formData.passwordConfirm)
    }
  }, [formData.password, formData.passwordConfirm])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Effacer l'erreur d'email lorsque l'utilisateur modifie l'email
    if (name === 'email' && emailError) {
      setEmailError('')
    }
    
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Vérifier d'abord si le serveur est disponible
    if (!isServerAvailable) {
      toast.error('Le serveur est inaccessible. Veuillez vérifier votre connexion et si le serveur backend est démarré.');
      return;
    }
    
    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.passwordConfirm) {
      setPasswordsMatch(false)
      return
    }
    
    // Réinitialiser les erreurs d'email
    setEmailError('')
    
    // Créer un objet de données à envoyer à l'API
    const registerData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      passwordConfirm: formData.passwordConfirm,
      role: formData.role 
    }
    
    try {
      console.log('Envoi des données:', { ...registerData, password: '[MASQUÉ]', passwordConfirm: '[MASQUÉ]' })
      
      const result = await register(registerData)
      
      // Redirection après inscription
      if (result && result.redirectToVerificationPending) {
        navigate('/verify')
      } else if (result === true && user && (!user.isEmailVerified && !user.isPhoneVerified)) {
        navigate('/verify')
      } else if (result === true) {
        if (user && user.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/user/dashboard')
        }
      }
    } catch (err) {
      // Gérer l'erreur ici si nécessaire
      console.error("Erreur lors de l'inscription:", err)
      
      // Vérifier si l'erreur est liée à la connexion au serveur
      if (err.message && err.message.includes("Network Error")) {
        setIsServerAvailable(false);
        toast.error('Impossible de se connecter au serveur. Veuillez vérifier que le serveur backend est démarré et accessible.');
      }
      // Vous pouvez vérifier si l'erreur est liée à l'email
      else if (err.message && err.message.includes("email")) {
        setEmailError("Cet email est déjà utilisé. Veuillez vous connecter ou utiliser une autre adresse email.")
      }
    }
  }
  
  // Fonction pour se connecter directement (si l'email existe déjà)
  const handleLoginRedirect = () => {
    navigate('/login', { state: { email: formData.email } })
  }
  
  // Fonction pour tenter de reconnecter au serveur
  const handleRetryConnection = async () => {
    toast.loading('Tentative de connexion au serveur...');
    const status = await checkServerStatus();
    setIsServerAvailable(status);
    toast.dismiss();
    
    if (status) {
      toast.success('Connexion au serveur rétablie!');
    } else {
      toast.error('Le serveur est toujours inaccessible. Veuillez vérifier qu\'il est bien démarré.');
    }
  }
  
  return (
    <div>
      <motion.h2
        className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Créer un compte
      </motion.h2>
      
      {/* Message d'erreur sur la disponibilité du serveur */}
      {!isServerAvailable && (
        <motion.div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="font-bold">Problème de connexion!</strong>
              <p className="mt-1">Impossible de se connecter au serveur. Veuillez vérifier que le serveur backend est démarré et accessible.</p>
              <button 
                onClick={handleRetryConnection}
                className="mt-2 bg-red-200 hover:bg-red-300 text-red-800 font-medium py-1 px-3 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Réessayer la connexion
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {error && !error.includes("email est déjà utilisé") && (
        <motion.div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </motion.div>
      )}
      
      {emailError && (
        <motion.div 
          className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong className="font-medium">Attention!</strong>
              <p className="mt-1">{emailError}</p>
              <button 
                onClick={handleLoginRedirect}
                className="mt-2 text-primary-600 hover:text-primary-800 font-medium underline"
              >
                Se connecter avec cet email
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {!passwordsMatch && formData.passwordConfirm && (
        <motion.div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> Les mots de passe ne correspondent pas</span>
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="label">
            Nom complet
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input"
            placeholder="John Doe"
            disabled={isLoading || !isServerAvailable}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="label">
            Adresse e-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`input ${emailError ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500' : ''}`}
            placeholder="exemple@domaine.com"
            disabled={isLoading || !isServerAvailable}
          />
          {emailError && (
            <p className="text-yellow-600 text-sm mt-1">
              Cet email est déjà associé à un compte.
            </p>
          )}
        </div>
        
        {/* Choix du rôle */}
        <div className="mb-4">
          <label className="label">Type de compte</label>
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
                disabled={isLoading || !isServerAvailable}
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
                disabled={isLoading || !isServerAvailable}
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
          
          {formData.role === 'admin' && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
              <div className="flex items-center mb-1">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">Attention</span>
              </div>
              <p>
                Les comptes administrateurs doivent être autorisés. Votre demande pourrait nécessiter une approbation supplémentaire.
              </p>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input pr-10"
              placeholder="••••••••"
              disabled={isLoading || !isServerAvailable}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || !isServerAvailable}
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
                Utilisez au moins 6 caractères, avec des majuscules, des chiffres et des caractères spéciaux.
              </p>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="passwordConfirm" className="label">
            Confirmer le mot de passe
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="passwordConfirm"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
            className={`input ${
              formData.password && 
              formData.passwordConfirm && 
              !passwordsMatch
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : ''
            }`}
            placeholder="••••••••"
            disabled={isLoading || !isServerAvailable}
          />
          
          {formData.password && 
           formData.passwordConfirm && 
           !passwordsMatch && (
            <p className="text-red-500 text-sm mt-1">
              Les mots de passe ne correspondent pas
            </p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full btn-primary py-3"
          disabled={
            isLoading || 
            !passwordsMatch ||
            passwordStrength < 2 ||
            !formData.password ||
            !formData.passwordConfirm ||
            emailError || // Désactiver le bouton si l'email est déjà utilisé
            !isServerAvailable // Désactiver le bouton si le serveur n'est pas disponible
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Inscription en cours...
            </div>
          ) : !isServerAvailable ? (
            'Serveur inaccessible'
          ) : (
            'S\'inscrire'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
        <p>
          Déjà inscrit?{' '}
          <Link 
            to="/login" 
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register