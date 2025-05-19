// src/pages/auth/VerifyPhone.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../config/config';

const VerifyPhone = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  
  const { user, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  // Effet pour vérifier si l'utilisateur a un numéro de téléphone défini
  useEffect(() => {
    if (user && !user.phone) {
      toast.error('Vous n\'avez pas de numéro de téléphone défini dans votre profil');
      navigate('/profile');
    }
  }, [user, navigate]);

  // Gérer le compte à rebours pour le renvoi de code
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Masquer partiellement le numéro de téléphone
  const maskPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/^(\+\d{2})(\d{6})(\d{4})$/, '$1******$3');
  };

  // Gérer la saisie du code (limiter à 6 chiffres)
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setVerificationCode(value);
    }
  };

  // Soumettre le code de vérification
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Le code de vérification doit comporter 6 chiffres');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.verifyPhone(verificationCode);
      toast.success('Numéro de téléphone vérifié avec succès!');
      
      // Mettre à jour les données utilisateur
      await checkAuth();
      
      setTimeout(() => {
        navigate(ROUTES.PROFILE);
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la vérification du téléphone:', error);
      setError(error.response?.data?.error || 'Échec de la vérification. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renvoyer le code de vérification
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setError(null);

    try {
      await authService.resendVerificationSMS();
      toast.success('Un nouveau code de vérification a été envoyé à votre téléphone.');
      setCountdown(60); // Bloquer le renvoi pendant 60 secondes
    } catch (error) {
      console.error('Erreur lors du renvoi du SMS:', error);
      setError(error.response?.data?.error || 'Échec de l\'envoi du code. Veuillez réessayer.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <motion.h2
        className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Vérification du téléphone
      </motion.h2>

      <motion.p
        className="text-center text-gray-600 dark:text-gray-400 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Nous avons envoyé un code de vérification à {user?.phone ? maskPhone(user.phone) : 'votre téléphone'}.
        <br />
        Veuillez saisir ce code ci-dessous pour vérifier votre numéro.
      </motion.p>

      {error && (
        <motion.div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}

      <motion.form 
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div>
          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Code de vérification
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-lg tracking-widest bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
              disabled={isSubmitting}
              required
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Entrez le code à 6 chiffres que nous avons envoyé à votre téléphone.
          </p>
        </div>

        <div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting || verificationCode.length !== 6}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Vérification en cours...
              </div>
            ) : (
              'Vérifier'
            )}
          </button>
        </div>
      </motion.form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Vous n'avez pas reçu de code?{' '}
          <button
            onClick={handleResendCode}
            disabled={isResending || countdown > 0}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isResending ? 'Envoi en cours...' : 
             countdown > 0 ? `Renvoi possible dans ${countdown}s` :
             'Renvoyer le code'}
          </button>
        </p>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/profile')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium"
        >
          Retour au profil
        </button>
      </div>
    </div>
  );
};

export default VerifyPhone;