import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../store/authStore'

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    passwordConfirm: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const { updatePassword, isLoading, error, clearErrors } = useAuthStore()
  
  // Nettoyer les erreurs lors du montage du composant
  useEffect(() => {
    clearErrors()
  }, [clearErrors])
  
  // Vérifier la force du mot de passe
  useEffect(() => {
    const { newPassword } = formData
    let strength = 0
    
    if (newPassword.length > 5) strength += 1
    if (newPassword.length > 9) strength += 1
    if (/[A-Z]/.test(newPassword)) strength += 1
    if (/[0-9]/.test(newPassword)) strength += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1
    
    setPasswordStrength(strength)
  }, [formData.newPassword])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Vérifier que les mots de passe correspondent
    if (formData.newPassword !== formData.passwordConfirm) {
      return
    }
    
    const success = await updatePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    })
    
    if (success) {
      // Réinitialiser le formulaire
      setFormData({
        currentPassword: '',
        newPassword: '',
        passwordConfirm: ''
      })
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Changer votre mot de passe
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="currentPassword" className="label">
            Mot de passe actuel
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="input pr-10"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
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
        </div>
        
        <div className="mb-4">
          <label htmlFor="newPassword" className="label">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="input pr-10"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
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
              formData.newPassword && 
              formData.passwordConfirm && 
              formData.newPassword !== formData.passwordConfirm 
                ? 'input-error' 
                : ''
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          
          {formData.newPassword && 
           formData.passwordConfirm && 
           formData.newPassword !== formData.passwordConfirm && (
            <p className="error-message">
              Les mots de passe ne correspondent pas
            </p>
          )}
        </div>
        
        <button
          type="submit"
          className="btn-primary py-2 px-4"
          disabled={
            isLoading || 
            !formData.currentPassword ||
            !formData.newPassword ||
            (formData.newPassword !== formData.passwordConfirm) ||
            passwordStrength < 2
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mise à jour...
            </div>
          ) : (
            'Changer le mot de passe'
          )}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
        <p className="mb-2 font-medium text-blue-700 dark:text-blue-300">Conseils pour un mot de passe fort :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Utiliser au moins 8 caractères</li>
          <li>Inclure au moins une majuscule et une minuscule</li>
          <li>Ajouter au moins un chiffre</li>
          <li>Inclure au moins un caractère spécial (!, @, #, etc.)</li>
          <li>Éviter les informations personnelles faciles à deviner</li>
        </ul>
      </div>
    </div>
  )
}

export default ChangePassword