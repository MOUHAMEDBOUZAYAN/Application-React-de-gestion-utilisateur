// middlewares/userLogger.js
// Middleware pour journaliser les actions des utilisateurs

const UserLog = require('../models/UserLog');

/**
 * Middleware pour journaliser les actions des utilisateurs
 * @param {string} action - Type d'action (login, logout, update, etc.)
 */
const userLogger = (action) => {
  return async (req, res, next) => {
    // Fonction pour capturer la réponse
    const originalSend = res.send;
    res.send = function(data) {
      res.responseData = data;
      originalSend.apply(res, arguments);
    };

    // Middleware suivant
    await next();
    
    try {
      // Ne journaliser que si la réponse est réussie (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let userId = null;
        
        // Identifier l'utilisateur
        if (req.user && req.user._id) {
          userId = req.user._id;
        } else if (req.body && req.body.email) {
          // Pour les actions comme login où req.user n'existe pas encore
          userId = 'Non authentifié'; // On pourrait chercher l'ID par email, mais ce n'est pas nécessaire
        }
        
        // Créer le log
        await UserLog.create({
          user: userId,
          action,
          method: req.method,
          route: req.originalUrl,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          // Masquer les données sensibles
          requestData: sanitizeData(req.body),
          status: res.statusCode
        });
      }
    } catch (error) {
      // Ne pas bloquer la réponse en cas d'erreur de journalisation
      console.error('Erreur de journalisation:', error);
    }
  };
};

/**
 * Sanitiser les données pour ne pas stocker d'informations sensibles
 * @param {Object} data - Données à sanitiser
 * @returns {Object} - Données sanitisées
 */
const sanitizeData = (data) => {
  if (!data) return {};
  
  const sanitized = { ...data };
  
  // Masquer les mots de passe et autres données sensibles
  if (sanitized.password) sanitized.password = '[MASQUÉ]';
  if (sanitized.passwordConfirm) sanitized.passwordConfirm = '[MASQUÉ]';
  if (sanitized.currentPassword) sanitized.currentPassword = '[MASQUÉ]';
  if (sanitized.newPassword) sanitized.newPassword = '[MASQUÉ]';
  if (sanitized.token) sanitized.token = '[MASQUÉ]';
  
  return sanitized;
};

module.exports = userLogger;