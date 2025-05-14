import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../../../store/authStore'

const AccountSecurity = ({ user }) => {
  const [accountData, setAccountData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { token } = useAuthStore()
  
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setLoading(true)
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
        
        const response = await axios.get('/api/auth/status', config)
        setAccountData(response.data.data)
        setLoading(false)
      } catch (err) {
        console.error('Erreur lors du chargement des informations de sécurité:', err)
        setError('Impossible de charger les informations de sécurité du compte')
        setLoading(false)
      }
    }
    
    fetchAccountStatus()
  }, [token])
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Sécurité du Compte
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des informations de sécurité...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Sécurité du Compte
        </h2>
        <div className="bg-red-100 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Sécurité du Compte
      </h2>
      
      {accountData && (
        <div className="space-y-6">
          {/* État du compte */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              État du compte
            </h3>
            <div className="flex items-center">
              <span className={`h-4 w-4 rounded-full mr-2 ${
                accountData.accountLocked ? 'bg-red-500' : 'bg-green-500'
              }`}></span>
              <span className={accountData.accountLocked ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                {accountData.accountLocked ? 'Verrouillé' : 'Actif'}
              </span>
            </div>
            
            {accountData.accountLocked && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Votre compte est actuellement verrouillé en raison de trop nombreuses tentatives de connexion échouées. 
                Veuillez contacter l'administrateur pour le débloquer.
              </p>
            )}
          </div>
          
          {/* Tentatives de connexion */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Tentatives de connexion
            </h3>
            <div>
              <div className="mb-2">
                <span className="text-gray-600 dark:text-gray-400">Tentatives échouées récentes:</span>
                <span className={`ml-2 font-medium ${
                  accountData.loginAttempts > 0 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {accountData.loginAttempts}
                </span>
              </div>
              
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    accountData.loginAttempts === 0
                      ? 'bg-green-500'
                      : accountData.loginAttempts < 3
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (accountData.loginAttempts / 5) * 100)}%` }}
                ></div>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Votre compte sera verrouillé après 5 tentatives de connexion échouées.
              </p>
            </div>
          </div>
          
          {/* Dernière connexion */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Dernière connexion
            </h3>
            <div>
              {accountData.lastLogin ? (
                <p className="text-gray-600 dark:text-gray-400">
                  Vous vous êtes connecté pour la dernière fois le{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(accountData.lastLogin).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Aucune connexion récente enregistrée.
                </p>
              )}
            </div>
          </div>
          
          {/* Conseils de sécurité */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
              Conseils de sécurité
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Changez régulièrement votre mot de passe</li>
              <li>N'utilisez jamais le même mot de passe sur plusieurs sites</li>
              <li>Activez l'authentification à deux facteurs lorsqu'elle est disponible</li>
              <li>Vérifiez régulièrement l'activité de votre compte</li>
              <li>Ne partagez jamais vos identifiants avec d'autres personnes</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountSecurity