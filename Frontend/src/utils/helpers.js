// src/utils/helpers.js
// Fonctions utilitaires pour l'application

/**
 * Combine des noms de classes conditionnels en une seule chaîne
 * @param {string[]} classes - Liste de classes à combiner
 * @returns {string} Classes combinées
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Masquer partiellement un email pour l'affichage
 * @param {string} email - Email à masquer
 * @returns {string} Email masqué
 */
export function maskEmail(email) {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  const hiddenLocal = localPart.substring(0, 2) + '*'.repeat(Math.max(2, localPart.length - 4)) + localPart.slice(-2);
  return `${hiddenLocal}@${domain}`;
}

/**
 * Masquer partiellement un numéro de téléphone pour l'affichage
 * @param {string} phone - Numéro de téléphone à masquer
 * @returns {string} Numéro de téléphone masqué
 */
export function maskPhone(phone) {
  if (!phone) return '';
  return phone.replace(/^(\+\d{2})(\d{6})(\d{2})$/, '$1******$3');
}

/**
 * Calculer la force d'un mot de passe
 * @param {string} password - Mot de passe à évaluer
 * @returns {number} Force du mot de passe (0-5)
 */
export function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (!password) return strength;
  
  // Longueur minimale
  if (password.length > 5) strength += 1;
  // Longueur plus sécurisée
  if (password.length > 9) strength += 1;
  // Présence de majuscules
  if (/[A-Z]/.test(password)) strength += 1;
  // Présence de chiffres
  if (/[0-9]/.test(password)) strength += 1;
  // Présence de caractères spéciaux
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return strength;
}

/**
 * Validation d'email
 * @param {string} email - Email à valider
 * @returns {boolean} True si l'email est valide
 */
export function isValidEmail(email) {
  // Expression régulière simple pour la validation d'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validation de numéro de téléphone
 * @param {string} phone - Numéro de téléphone à valider
 * @returns {boolean} True si le numéro est valide
 */
export function isValidPhone(phone) {
  // Expression régulière pour les numéros de téléphone internationaux
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Formater une date en français
 * @param {string|Date} date - Date à formater
 * @returns {string} Date formatée
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Tronquer un texte avec ellipsis
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}