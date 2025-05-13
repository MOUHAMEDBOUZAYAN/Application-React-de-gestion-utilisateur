import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login, register, logout, verifyToken } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Vérifier si le token est expiré
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expiré
            localStorage.removeItem('token');
            setCurrentUser(null);
          } else {
            // Vérifier le token avec le backend
            const response = await verifyToken();
            setCurrentUser(response.data.user);
          }
        } catch (err) {
          console.error('Erreur lors de la vérification du token:', err);
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginUser = async (credentials) => {
    setError(null);
    try {
      const response = await login(credentials);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
      throw err;
    }
  };

  const registerUser = async (userData) => {
    setError(null);
    try {
      const response = await register(userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
      throw err;
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    logout();
  };

  const updateUserData = (userData) => {
    setCurrentUser(userData);
  };

  const value = {
    currentUser,
    loading,
    error,
    loginUser,
    registerUser,
    logoutUser,
    updateUserData,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};