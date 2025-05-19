// src/pages/auth/VerificationPending.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../../services/api';

const VerificationPending = () => {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  useEffect(() => {
    // Récupérer l'email depuis le localStorage
    const pendingEmail = localStorage.getItem('pendingEmail');
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    // Implémenter la logique pour renvoyer un email
    if (!email) {
      toast.error('Aucune adresse email disponible');
      return;
    }
    
    setIsResending(true);
    try {
      await authService.resendVerificationEmail(email);
      toast.success('Un nouvel email de vérification a été envoyé. Veuillez vérifier votre boîte de réception.');
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'email de vérification:', error);
      
      // Gestion d'erreur améliorée
      if (error.response?.status === 401) {
        toast.error('L\'email de vérification a déjà été envoyé. Si vous ne l\'avez pas reçu, veuillez vérifier votre dossier spam ou contactez le support.');
      } else if (error.response?.data?.error) {
        toast.error(`Erreur: ${error.response.data.error}`);
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email de vérification');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center max-w-lg mx-auto">
      <motion.h2
        className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Vérification en attente
      </motion.h2>

      <motion.div
        className="bg-blue-100 dark:bg-blue-900/20 p-6 rounded-lg mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg className="h-16 w-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-medium text-blue-800 dark:text-blue-300 mb-2">
          Vérifiez votre email
        </h3>
        <p className="text-blue-700 dark:text-blue-400 mb-4">
          {email ? (
            <>
              Nous avons envoyé un email de vérification à <strong>{email}</strong>. 
              Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification.
            </>
          ) : (
            <>
              Nous avons envoyé un email de vérification à votre adresse email.
              Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification.
            </>
          )}
        </p>
        <button
          onClick={handleResendEmail}
          disabled={isResending}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Envoi en cours...
            </div>
          ) : (
            'Renvoyer l\'email de vérification'
          )}
        </button>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Si vous ne recevez pas l'email, vérifiez votre dossier de spam ou contactez notre support.
        </p>
      </motion.div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
        <Link
          to="/login"
          className="inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
};

export default VerificationPending;