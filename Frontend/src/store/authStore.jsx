// src/store/authStore.jsx - Version corrigée pour le problème d'URLs
import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from '../config/axiosConfig'; // Import depuis le fichier de configuration

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Vérifier l'authentification à partir du token
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    set({ isLoading: true });
    try {
      // Récupérer les informations de l'utilisateur
      const response = await axios.get('/auth/me');
      
      // Extraire les données utilisateur
      const userData = response.data.data;
      
      set({ 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error.response?.data?.error || 'Erreur de connexion. Veuillez vous reconnecter.' 
      });
      return false;
    }
  },

  // Vérifier si l'utilisateur est un administrateur
  isAdmin: () => {
    const { user } = get();
    return !!(user && user.role === 'admin');
  },

  // Vérification de disponibilité d'email
  checkEmailAvailability: async (email) => {
    try {
      set({ isLoading: true });
      const response = await axios.post('/auth/check-email', { email });
      set({ isLoading: false });
      return response.data.available; // true si l'email est disponible
    } catch (error) {
      console.error('Erreur lors de la vérification d\'email:', error);
      set({ isLoading: false });
      return false; // Supposons que l'email n'est pas disponible en cas d'erreur
    }
  },

  // Inscription
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      // S'assurer que le rôle est bien transmis
      if (!userData.role || (userData.role !== 'admin' && userData.role !== 'user')) {
        console.warn('Rôle non spécifié ou invalide dans register, utilisation de la valeur par défaut');
      }
      
      const response = await axios.post('/auth/register', userData);
      
      const { token, user } = response.data;
      
      // Stocker le token
      localStorage.setItem('token', token);
      
      // Mettre à jour le state avec l'utilisateur
      set({ 
        token, 
        user,
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      
      toast.success('Inscription réussie! Bienvenue!');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      let errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.';
      
      // Si c'est une erreur d'email déjà utilisé, on la met en forme spéciale
      if (errorMessage.includes('email') && errorMessage.includes('utilisé')) {
        errorMessage = 'Cet email est déjà utilisé';
      }
      
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  // Connexion
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/auth/login', credentials);
      
      const { token, user } = response.data;
      
      // Stocker le token
      localStorage.setItem('token', token);
      
      // Mettre à jour le state avec l'utilisateur
      set({ 
        token, 
        user,
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      
      toast.success('Connexion réussie!');
      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      const errorMessage = error.response?.data?.error || 'Identifiants invalides. Veuillez réessayer.';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  // Déconnexion
  logout: async () => {
    set({ isLoading: true });
    try {
      // Appel API pour déconnecter côté serveur
      if (get().token) {
        await axios.get('/auth/logout');
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer le token local
      localStorage.removeItem('token');
      
      // Réinitialiser le state
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
      
      toast.success('Vous êtes déconnecté.');
    }
  },

  // Demande de réinitialisation de mot de passe
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post('/auth/forgotpassword', { email });
      set({ isLoading: false });
      toast.success('Un email de réinitialisation a été envoyé à votre adresse email.');
      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la demande de réinitialisation. Veuillez réessayer.';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  // Réinitialisation de mot de passe
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      await axios.put(`/auth/resetpassword/${token}`, { password });
      set({ isLoading: false });
      toast.success('Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.');
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  // Mise à jour du profil
  updateProfile: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put('/auth/updateprofile', userData);
      set({ 
        user: response.data.data, 
        isLoading: false,
        error: null 
      });
      
      toast.success('Profil mis à jour avec succès!');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du profil. Veuillez réessayer.';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  // Mise à jour du mot de passe - CORRECTION
  updatePassword: async (passwordData) => {
    set({ isLoading: true, error: null });
    try {
      // Vérifier que tous les champs requis sont présents
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.passwordConfirm) {
        set({ 
          isLoading: false, 
          error: 'Tous les champs sont requis' 
        });
        return false;
      }
      
      // Vérifier que les mots de passe correspondent
      if (passwordData.newPassword !== passwordData.passwordConfirm) {
        set({ 
          isLoading: false, 
          error: 'La confirmation du mot de passe est requise, Les mots de passe ne correspondent pas' 
        });
        return false;
      }
      
      // Appel API
      await axios.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        passwordConfirm: passwordData.passwordConfirm
      });
      
      set({ isLoading: false, error: null });
      toast.success('Mot de passe mis à jour avec succès!');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  // Effacer les erreurs
  clearErrors: () => {
    set({ error: null });
  }
}));