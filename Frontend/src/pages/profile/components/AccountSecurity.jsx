// src/components/profile/AccountSecurity.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';

const AccountSecurity = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [accountStatus, setAccountStatus] = useState({
    isEmailVerified: false,
    isPhoneVerified: false,
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmailVerification, setIsSendingEmailVerification] = useState(false);
  const [isSendingSMSVerification, setIsSendingSMSVerification] = useState(false);

  // Récupérer le statut du compte
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        // Utiliser les données de l'utilisateur connecté
        if (user) {
          setAccountStatus({
            isEmailVerified: user.isEmailVerified || false,
            isPhoneVerified: user.isPhoneVerified || false,
            email: user.email || '',
            phone: user.phone || ''
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération du statut du compte:', error);
        toast.error('Impossible de récupérer le statut de votre compte');
        setIsLoading(false);
      }
    };

    fetchAccountStatus();
  }, [user]);

  // Renvoyer l'email de vérification
  const handleResendVerificationEmail = async () => {
    setIsSendingEmailVerification(true);
    try {
      const response = await authService.resendVerificationEmail();
      toast.success('Un email de vérification a été envoyé à votre adresse email');
      console.log('Réponse du renvoi de l\'email de vérification:', response);
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'email de vérification:', error);
      toast.error('Erreur lors de l\'envoi de l\'email de vérification');
    } finally {
      setIsSendingEmailVerification(false);
    }
  };

  // Renvoyer le SMS de vérification et rediriger vers la page de vérification
  const handleResendVerificationSMS = async () => {
    setIsSendingSMSVerification(true);
    try {
      const response = await authService.resendVerificationSMS();
      toast.success('Un SMS de vérification a été envoyé à votre numéro de téléphone');
      console.log('Réponse du renvoi du SMS de vérification:', response);
      
      // Rediriger vers la page de vérification de téléphone
      navigate('/verify-phone');
    } catch (error) {
      console.error('Erreur lors du renvoi du SMS de vérification:', error);
      toast.error('Erreur lors de l\'envoi du SMS de vérification');
    } finally {
      setIsSendingSMSVerification(false);
    }
  };

  // Masquer partiellement l'email pour affichage
  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    const hiddenLocal = localPart.substring(0, 2) + '*'.repeat(Math.max(2, localPart.length - 4)) + localPart.slice(-2);
    return `${hiddenLocal}@${domain}`;
  };

  // Masquer partiellement le téléphone pour affichage
  const maskPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/^(\+\d{2})(\d{6})(\d{2})$/, '$1******$3');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Sécurité du compte
      </h3>

      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Statut de vérification de l'email */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">
                    Adresse e-mail
                  </h4>
                  {accountStatus.isEmailVerified ? (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium rounded-full">
                      Vérifiée
                    </span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium rounded-full">
                      Non vérifiée
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {accountStatus.email ? maskEmail(accountStatus.email) : 'Aucune adresse e-mail définie'}
                </p>
              </div>
              {!accountStatus.isEmailVerified && accountStatus.email && (
                <button
                  onClick={handleResendVerificationEmail}
                  disabled={isSendingEmailVerification}
                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSendingEmailVerification ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    'Vérifier'
                  )}
                </button>
              )}
            </div>
            {!accountStatus.isEmailVerified && accountStatus.email && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                <div className="flex items-center mb-1">
                  <svg className="h-5 w-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">Email non vérifié</span>
                </div>
                <p>
                  Veuillez vérifier votre adresse e-mail pour activer toutes les fonctionnalités de votre compte.Vous devriez avoir reçu un e-mail de vérification. Si vous ne l'avez pas reçu, cliquez sur "Vérifier" pour en recevoir un nouveau.
                </p>
              </div>
            )}
          </div>

          {/* Statut de vérification du téléphone */}
          {accountStatus.phone && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      Numéro de téléphone
                    </h4>
                    {accountStatus.isPhoneVerified ? (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium rounded-full">
                        Vérifié
                      </span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium rounded-full">
                        Non vérifié
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {maskPhone(accountStatus.phone)}
                  </p>
                </div>
                {!accountStatus.isPhoneVerified && (
                  <button
                    onClick={handleResendVerificationSMS}
                    disabled={isSendingSMSVerification}
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSendingSMSVerification ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      'Vérifier'
                    )}
                  </button>
                )}
              </div>
              {!accountStatus.isPhoneVerified && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                  <div className="flex items-center mb-1">
                    <svg className="h-5 w-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">Téléphone non vérifié</span>
                  </div>
                  <p>
                    Veuillez vérifier votre numéro de téléphone pour une sécurité renforcée.
                    Cliquez sur "Vérifier" pour recevoir un SMS avec un code de vérification.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AccountSecurity;