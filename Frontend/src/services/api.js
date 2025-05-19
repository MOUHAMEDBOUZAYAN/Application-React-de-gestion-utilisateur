// src/services/api.js
// Service pour gérer les appels API

import axios from '../config/axiosConfig';

// Service d'authentification
export const authService = {
  // Inscription
  register: async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Vérifier la disponibilité d'un email
  checkEmailAvailability: async (email) => {
    try {
      const response = await axios.post('/auth/check-email', { email });
      return response.data.available;
    } catch (error) {
      return false;
    }
  },

  // Connexion
  login: async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      const response = await axios.get('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  // Récupérer les infos de l'utilisateur connecté
  getMe: async () => {
    try {
      const response = await axios.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer le statut du compte (modifié pour utiliser /auth/me)
  getAccountStatus: async () => {
    try {
      // Cette route n'existe pas dans votre backend, on utilise "me" à la place
      const response = await axios.get('/auth/me');
      return {
        success: true,
        data: {
          isEmailVerified: response.data.data.isEmailVerified || false,
          isPhoneVerified: response.data.data.isPhoneVerified || false,
          email: response.data.data.email,
          phone: response.data.data.phone
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du compte:', error);
      throw error;
    }
  },

  // Mot de passe oublié
  forgotPassword: async (email) => {
    try {
      const response = await axios.post('/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Réinitialiser le mot de passe
  resetPassword: async (token, password, passwordConfirm) => {
    try {
      const response = await axios.put(`/auth/resetpassword/${token}`, { 
        password, 
        passwordConfirm 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mettre à jour le mot de passe
  updatePassword: async (passwordData) => {
    try {
      const response = await axios.put('/auth/updatepassword', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mettre à jour le profil
  updateProfile: async (userData) => {
    try {
      const response = await axios.put('/auth/updateprofile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Vérifier le téléphone
  verifyPhone: async (verificationCode) => {
    try {
      const response = await axios.post('/auth/verifyphone', { verificationCode });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Vérifier l'email (corrigé avec validation de token)
  verifyEmail: async (token) => {
    try {
      // Ajout de la vérification de la validité du token
      if (!token) {
        return {
          success: false,
          error: 'Token de vérification non fourni'
        };
      }
      
      const response = await axios.get(`/auth/verifyemail/${token}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      throw error;
    }
  },

  // Renvoyer l'email de vérification - MODIFIÉ pour gérer le cas sans authentification
  resendVerificationEmail: async (email) => {
    try {
      // La route doit être adaptée à votre backend - soit elle accepte un email, soit elle utilise le token
      let response;
      // Récupérer le token temporaire s'il existe
      const tempToken = localStorage.getItem('temp_token');
      
      if (tempToken) {
        // Si nous avons un token, essayer d'abord avec le token
        try {
          response = await axios.post('/auth/resendverificationemail', {}, {
            headers: {
              Authorization: `Bearer ${tempToken}`
            }
          });
        } catch (tokenError) {
          // Si ça échoue avec le token, essayer avec l'email
          response = await axios.post('/auth/public/resendverification', { email });
        }
      } else {
        // Si nous n'avons pas de token, utiliser directement l'email
        response = await axios.post('/auth/public/resendverification', { email });
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
      throw error;
    }
  },

  // Renvoyer le SMS de vérification
  resendVerificationSMS: async () => {
    try {
      const response = await axios.post('/auth/resendverificationsms');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Service utilisateurs (admin)
export const userService = {
  // Obtenir tous les utilisateurs
  getUsers: async (page = 1, limit = 10, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      const response = await axios.get(`/users?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtenir un utilisateur
  getUser: async (id) => {
    try {
      const response = await axios.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Créer un utilisateur
  createUser: async (userData) => {
    try {
      const response = await axios.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mettre à jour un utilisateur
  updateUser: async (id, userData) => {
    try {
      const response = await axios.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (id) => {
    try {
      const response = await axios.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Déverrouiller un compte utilisateur
  unlockAccount: async (id) => {
    try {
      const response = await axios.put(`/users/${id}/unlock`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Service logs (admin)
export const logService = {
  // Obtenir tous les logs
  getLogs: async (page = 1, limit = 25, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      const response = await axios.get(`/logs?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtenir les statistiques des logs
  getLogStats: async () => {
    try {
      const response = await axios.get('/logs/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Service admin
export const adminService = {
  // Obtenir les statistiques des utilisateurs
  getUserStats: async () => {
    try {
      const response = await axios.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtenir les logs des utilisateurs
  getUserLogs: async (page = 1, limit = 20, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      const response = await axios.get(`/admin/logs?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtenir l'historique des changements d'un utilisateur
  getUserChangeHistory: async (userId) => {
    try {
      const response = await axios.get(`/admin/users/${userId}/history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtenir les utilisateurs récemment modifiés
  getRecentChanges: async () => {
    try {
      const response = await axios.get('/admin/recent-changes');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default {
  auth: authService,
  users: userService,
  logs: logService,
  admin: adminService
};