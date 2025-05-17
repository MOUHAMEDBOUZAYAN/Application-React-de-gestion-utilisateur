// src/pages/auth/VerifyEmail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../config/axiosConfig';
import { ROUTES } from '../../config/config';

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState({
    isLoading: true,
    isSuccess: false,
    error: null
  });

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        await axios.get(`/auth/verifyemail/${token}`);
        setVerificationStatus({
          isLoading: false,
          isSuccess: true,
          error: null
        });

        // Rediriger vers la page de connexion après 5 secondes
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 5000);
      } catch (error) {
        setVerificationStatus({
          isLoading: false,
          isSuccess: false,
          error: error.response?.data?.error || 'Une erreur est survenue lors de la vérification de votre email.'
        });
      }
    };

    verifyEmailToken();
  }, [token, navigate]);

  return (
    <div className="text-center">
      <motion.h2
        className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Vérification de l'email
      </motion.h2>

      {verificationStatus.isLoading ? (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 border-t-2 border-b-2 border-primary-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification de votre email en cours...</p>
        </motion.div>
      ) : verificationStatus.isSuccess ? (
        <motion.div
          className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium text-green-800 dark:text-green-300 mb-2">
            Email vérifié avec succès!
          </h3>
          <p className="text-green-700 dark:text-green-400 mb-4">
            Votre adresse email a été vérifiée avec succès. Vous allez être redirigé vers la page de connexion dans quelques secondes.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Se connecter maintenant
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium text-red-800 dark:text-red-300 mb-2">
            Échec de la vérification
          </h3>
          <p className="text-red-700 dark:text-red-400 mb-4">
            {verificationStatus.error}
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VerifyEmail;