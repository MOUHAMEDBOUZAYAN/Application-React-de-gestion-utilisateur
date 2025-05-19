// src/utils/authUtils.js
import axios from 'axios';
import { API_URL } from '../config/config';

/**
 * Vérifie si le serveur backend est accessible
 * @returns {Promise<boolean>} True si le serveur est accessible
 */
export const checkServerStatus = async () => {
  try {
    // Essayer différents endpoints pour tester la disponibilité du serveur
    try {
      // D'abord essayer l'endpoint /health s'il existe
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (healthError) {
      // Si /health échoue, essayer la racine du serveur
      const rootResponse = await axios.get(`${API_URL}`, { timeout: 5000 });
      return rootResponse.status >= 200 && rootResponse.status < 400;
    }
  } catch (error) {
    console.error('Le serveur backend n\'est pas accessible:', error.message);
    return false;
  }
};

/**
 * Vérifie la validité d'un token JWT
 * @param {string} token - Le token JWT à vérifier
 * @returns {boolean} True si le token est valide et non expiré
 */
export const isValidToken = (token) => {
  if (!token) return false;
  
  try {
    // Extraire la partie payload du token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    
    // Vérifier si le token n'est pas expiré
    return exp * 1000 > Date.now();
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
};

/**
 * Masque partiellement un email pour l'affichage sécurisé
 * @param {string} email - Email à masquer
 * @returns {string} Email masqué
 */
export const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  const hiddenLocal = localPart.substring(0, 2) + '*'.repeat(Math.max(2, localPart.length - 4)) + localPart.slice(-2);
  return `${hiddenLocal}@${domain}`;
};

/**
 * Masque partiellement un numéro de téléphone pour l'affichage sécurisé
 * @param {string} phone - Numéro de téléphone à masquer
 * @returns {string} Numéro de téléphone masqué
 */
export const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/^(\+\d{2})(\d{6})(\d{2})$/, '$1******$3');
};

export default {
  checkServerStatus,
  isValidToken,
  maskEmail,
  maskPhone
};