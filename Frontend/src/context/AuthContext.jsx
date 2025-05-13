import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialisation - Vérifier si un token existe déjà
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Vérifier si le token n'est pas expiré
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp > currentTime) {
          // Configurer axios avec le token
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Récupérer les infos utilisateur
          fetchUserData();
        } else {
          // Token expiré
          logout();
        }
      } catch (err) {
        console.error("Token invalide", err);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Récupérer les données utilisateur
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile`);
      setCurrentUser(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des données utilisateur", err);
      logout();
    }
  };

  // Connexion
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Sauvegarder le token
      localStorage.setItem('token', token);
      
      // Configurer axios avec le token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error("Erreur de connexion", err);
      setError(err.response?.data?.message || "Erreur de connexion");
      throw err;
    }
  };

  // Inscription
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, userData);
      return response.data;
    } catch (err) {
      console.error("Erreur d'inscription", err);
      setError(err.response?.data?.message || "Erreur d'inscription");
      throw err;
    }
  };

  // Confirmation de compte
  const confirmAccount = async (token) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/confirm`, { token });
      return response.data;
    } catch (err) {
      console.error("Erreur de confirmation", err);
      setError(err.response?.data?.message || "Erreur de confirmation");
      throw err;
    }
  };

  // Demande de réinitialisation de mot de passe
  const forgotPassword = async (email) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { email });
      return response.data;
    } catch (err) {
      console.error("Erreur de demande de réinitialisation", err);
      setError(err.response?.data?.message || "Erreur de demande");
      throw err;
    }
  };

  // Réinitialisation de mot de passe
  const resetPassword = async (token, password) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, { 
        token, 
        password 
      });
      return response.data;
    } catch (err) {
      console.error("Erreur de réinitialisation", err);
      setError(err.response?.data?.message || "Erreur de réinitialisation");
      throw err;
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/users/profile`, userData);
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      console.error("Erreur de mise à jour", err);
      setError(err.response?.data?.message || "Erreur de mise à jour");
      throw err;
    }
  };

  // Demande de changement d'email
  const requestEmailChange = async (newEmail) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/request-email-change`, { 
        newEmail 
      });
      return response.data;
    } catch (err) {
      console.error("Erreur de demande de changement d'email", err);
      setError(err.response?.data?.message || "Erreur de demande");
      throw err;
    }
  };

  // Confirmer le changement d'email
  const confirmEmailChange = async (token) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/confirm-email-change`, { 
        token 
      });
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      console.error("Erreur de confirmation d'email", err);
      setError(err.response?.data?.message || "Erreur de confirmation");
      throw err;
    }
  };

  // Demande de changement de téléphone
  const requestPhoneChange = async (newPhone) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/request-phone-change`, { 
        newPhone 
      });
      return response.data;
    } catch (err) {
      console.error("Erreur de demande de changement de téléphone", err);
      setError(err.response?.data?.message || "Erreur de demande");
      throw err;
    }
  };

  // Confirmer le changement de téléphone
  const confirmPhoneChange = async (code) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/confirm-phone-change`, { 
        code 
      });
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      console.error("Erreur de confirmation de téléphone", err);
      setError(err.response?.data?.message || "Erreur de confirmation");
      throw err;
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setLoading(false);
  };

  // Valeurs à exposer dans le contexte
  const contextValue = {
    currentUser,
    loading,
    error,
    login,
    register,
    confirmAccount,
    forgotPassword,
    resetPassword,
    updateProfile,
    requestEmailChange,
    confirmEmailChange,
    requestPhoneChange,
    confirmPhoneChange,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;