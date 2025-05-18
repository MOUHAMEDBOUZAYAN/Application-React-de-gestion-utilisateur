// src/config/config.js
// Configuration globale de l'application

// URL de base de l'API - Modifiée pour s'assurer que l'URL de base est correcte
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configuration de durée des notifications toast
export const TOAST_DURATION = 5000; // 5 secondes

// Configuration de pagination par défaut
export const DEFAULT_PAGE_SIZE = 10;

// Délai avant redirection automatique (en millisecondes)
export const REDIRECT_DELAY = 3000; // 3 secondes

// Configuration des routes
export const ROUTES = {
  // Routes publiques
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  EMAIL_VERIFICATION: '/verify-email',
  PHONE_VERIFICATION: '/verify-phone',
  
  // Routes utilisateur
  USER_DASHBOARD: '/user/dashboard',
  PROFILE: '/profile',
  
  // Routes administrateur
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_USERS_ADD: '/admin/users/add',
  ADMIN_USERS_EDIT: '/admin/users/edit',
  ADMIN_LOGS: '/admin/logs',
  ADMIN_SETTINGS: '/admin/settings'
};

// Messages d'erreur communs
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet.',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à accéder à cette ressource.',
  SERVER_ERROR: 'Une erreur serveur s\'est produite. Veuillez réessayer ultérieurement.',
  VALIDATION_ERROR: 'Les données fournies sont invalides. Veuillez vérifier vos entrées.'
};

// Configuration des éléments de validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50
};