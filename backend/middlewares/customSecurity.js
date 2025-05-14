// middlewares/customSecurity.js
// Middleware personnalisé pour la sécurité - remplace express-mongo-sanitize et xss-clean

/**
 * Vérifie si un objet contient des caractères MongoDB d'injection potentielle
 * @param {Object} obj - L'objet à vérifier
 * @returns {boolean} - true si des caractères suspects sont trouvés
 */
const hasMongoInjection = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  
  const check = (value) => {
    if (typeof value === 'string') {
      // Vérifier les opérateurs Mongo communs
      return (
        value.includes('$') ||
        value.includes('{$') ||
        value.includes('$gt:') ||
        value.includes('$lt:') ||
        value.includes('$ne:') ||
        value.includes('$nin:') ||
        value.includes('$in:')
      );
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.some(item => check(item));
      } else {
        return Object.keys(value).some(key => key.startsWith('$') || check(value[key]));
      }
    }
    return false;
  };
  
  return check(obj);
};

/**
 * Échapper les caractères spéciaux HTML pour prévenir XSS
 * @param {string} str - Chaîne à échapper
 * @returns {string} - Chaîne échappée
 */
const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Fonction récursive pour échapper les valeurs de chaîne dans un objet
 * @param {Object} obj - Objet à nettoyer
 * @returns {Object} - Objet nettoyé
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = escapeHTML(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

/**
 * Middleware de sécurité personnalisé pour remplacer express-mongo-sanitize et xss-clean
 */
const customSecurity = (req, res, next) => {
  try {
    // 1. Vérification pour les injections MongoDB
    if (hasMongoInjection(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'Caractères non autorisés détectés dans les données soumises'
      });
    }
    
    if (hasMongoInjection(req.params)) {
      return res.status(400).json({
        success: false,
        error: 'Caractères non autorisés détectés dans les paramètres d\'URL'
      });
    }
    
    // Ne pas toucher à req.query directement
    if (req.query && Object.keys(req.query).length > 0) {
      const hasInjection = hasMongoInjection(req.query);
      if (hasInjection) {
        return res.status(400).json({
          success: false,
          error: 'Caractères non autorisés détectés dans la requête'
        });
      }
    }
    
    // 2. Protection XSS - Sanitize req.body
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize req.params
    if (req.params && Object.keys(req.params).length > 0) {
      // Créer une copie des paramètres, les nettoyer, puis les réassigner
      const sanitizedParams = sanitizeObject(Object.assign({}, req.params));
      Object.keys(req.params).forEach(key => {
        req.params[key] = sanitizedParams[key];
      });
    }
    
    // Ne pas modifier req.query directement
    
    next();
  } catch (err) {
    console.error('Erreur dans le middleware customSecurity:', err);
    next();
  }
};

module.exports = customSecurity;