// src/config/axiosConfig.js
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from './config';

// Configuration de base avec l'URL correcte du backend
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 secondes de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Permettre l'envoi des cookies pour l'authentification
});

// Intercepteur pour les requêtes - Ajout automatique du token
axiosInstance.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('token');
    
    // Si un token existe, l'ajouter aux headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log pour débogage en développement
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📤 Requête ${config.method?.toUpperCase()} envoyée vers ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur simplifié pour les réponses
axiosInstance.interceptors.response.use(
  (response) => {
    // Log pour débogage en développement
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📥 Réponse reçue de ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Gestion des erreurs détaillée pour faciliter le débogage
    if (!error.response) {
      // Erreur réseau (serveur non disponible, CORS, etc.)
      console.error('❌ Erreur réseau:', error.message);
      
      // Message d'erreur plus informatif
      if (error.message.includes('Network Error')) {
        toast.error('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré et accessible.');
      } else {
        toast.error(`Erreur réseau: ${error.message}`);
      }
    } 
    else {
      // Erreur avec réponse du serveur (4xx, 5xx)
      console.error(`❌ Erreur ${error.response.status}:`, error.response.data);
      const errorMessage = error.response.data?.error || 'Une erreur s\'est produite';
      toast.error(errorMessage);
      
      // Gestion des erreurs d'authentification
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Ne pas rediriger automatiquement si on est sur la page de login
        if (!error.config.url.includes('/login')) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;