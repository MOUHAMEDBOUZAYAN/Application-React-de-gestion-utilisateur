// src/store/authStore.jsx
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
      const response = await axios.get('/api/auth/me');
      
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

  // Inscription
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      // S'assurer que le rôle est bien transmis
      if (!userData.role || (userData.role !== 'admin' && userData.role !== 'user')) {
        console.warn('Rôle non spécifié ou invalide dans register, utilisation de la valeur par défaut');
      }
      
      const response = await axios.post('/api/auth/register', userData);
      
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
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  // Connexion
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/auth/login', credentials);
      
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
        await axios.get('/api/auth/logout');
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
      await axios.post('/api/auth/forgotpassword', { email });
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
      await axios.put(`/api/auth/resetpassword/${token}`, { password });
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
      const response = await axios.put('/api/auth/updatedetails', userData);
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

  // Mise à jour du mot de passe
  updatePassword: async (passwordData) => {
    set({ isLoading: true, error: null });
    try {
      await axios.put('/api/auth/updatepassword', passwordData);
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