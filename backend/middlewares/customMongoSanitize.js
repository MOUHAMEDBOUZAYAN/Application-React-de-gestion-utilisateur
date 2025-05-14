// Alternative à express-mongo-sanitize
// Créez ce fichier comme middlewares/customMongoSanitize.js

/**
 * Fonction qui vérifie si un objet contient des caractères MongoDB d'injection potentielle
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
 * Middleware pour détecter les tentatives d'injection MongoDB
 */
const customMongoSanitize = (req, res, next) => {
  try {
    // Vérifier req.body
    if (hasMongoInjection(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'Caractères non autorisés détectés dans les données soumises'
      });
    }
    
    // Vérifier req.params
    if (hasMongoInjection(req.params)) {
      return res.status(400).json({
        success: false,
        error: 'Caractères non autorisés détectés dans les paramètres d\'URL'
      });
    }
    
    // Ne pas toucher à req.query, mais vérifier son contenu
    if (req.query && Object.keys(req.query).length > 0) {
      if (hasMongoInjection(req.query)) {
        return res.status(400).json({
          success: false,
          error: 'Caractères non autorisés détectés dans la requête'
        });
      }
    }
    
    next();
  } catch (err) {
    console.error('Erreur dans le middleware customMongoSanitize:', err);
    next();
  }
};

module.exports = customMongoSanitize;