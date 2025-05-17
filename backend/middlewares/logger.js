// middlewares/logger.js
// Middleware pour la journalisation des actions utilisateurs

const UserLog = require('../models/UserLog');

/**
 * Middleware pour enregistrer les actions utilisateurs
 * @param {string} action - Type d'action (login, register, etc.)
 * @param {string} description - Description de l'action
 */
const logger = (action, description = '') => {
  return async (req, res, next) => {
    // Exécuter d'abord le traitement de la requête
    const originalSend = res.send;
    
    // Remplacer la méthode send pour capturer la réponse
    res.send = function(data) {
      res.responseData = data;
      return originalSend.apply(res, arguments);
    };
    
    // Continuer le traitement
    await next();
    
    try {
      // Ne logger que les requêtes réussies (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Préparer les informations de journalisation
        const logData = {
          action,
          description: description || `Action ${action} effectuée`,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          details: {}
        };
        
        // Ajouter l'utilisateur si authentifié
        if (req.user && req.user._id) {
          logData.user = req.user._id;
          logData.description = `Utilisateur ${req.user.email || req.user._id} a ${description || action}`;
        } 
        // Pour les actions comme login, essayer d'extraire l'email du corps
        else if (req.body && req.body.email) {
          logData.details.email = req.body.email;
          logData.description = `${req.body.email} a tenté de ${description || action}`;
        }
        
        // Masquer les informations sensibles
        const sanitizedBody = { ...req.body };
        ['password', 'passwordConfirm', 'currentPassword', 'newPassword'].forEach(field => {
          if (sanitizedBody[field]) {
            sanitizedBody[field] = '[MASQUÉ]';
          }
        });
        
        // Ajouter des détails supplémentaires
        logData.details.method = req.method;
        logData.details.path = req.originalUrl;
        logData.details.body = sanitizedBody;
        
        // Enregistrer le log
        await UserLog.create(logData);
      }
    } catch (error) {
      // Ne pas bloquer la réponse en cas d'erreur de journalisation
      console.error('Erreur de journalisation:', error);
    }
  };
};

module.exports = logger;