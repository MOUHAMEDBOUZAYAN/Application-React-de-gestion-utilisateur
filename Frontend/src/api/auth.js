import axios from 'axios';

// Créer une instance axios avec l'URL de base
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const verifyToken = () => api.get('/auth/verify-token');
export const logout = () => api.post('/auth/logout');
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);
export const requestEmailVerification = (email) => api.post('/auth/request-email-verification', { email });
export const verifyPhone = (code, userId) => api.post('/auth/verify-phone', { code, userId });
export const requestPhoneVerification = (phone) => api.post('/auth/request-phone-verification', { phone });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post(`/auth/reset-password/${token}`, { password });

export default api;