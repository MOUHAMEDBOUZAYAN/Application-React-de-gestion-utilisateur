// utils/authStrategies.js
// Stratégies d'authentification disponibles

/**
 * Types de stratégies d'authentification supportées par l'API
 */
const AUTH_STRATEGIES = {
    JWT: 'jwt',
    SESSION: 'session',
    BASIC: 'basic'
  };
  
  /**
   * Déterminer quelle stratégie d'authentification utiliser
   * @param {string} preferredStrategy - Stratégie préférée
   * @returns {string} Stratégie à utiliser
   */
  const determineAuthStrategy = (preferredStrategy = null) => {
    // Utiliser la stratégie préférée si elle est valide
    if (preferredStrategy && Object.values(AUTH_STRATEGIES).includes(preferredStrategy)) {
      return preferredStrategy;
    }
    
    // Utiliser la stratégie définie dans les variables d'environnement
    if (process.env.AUTH_STRATEGY && Object.values(AUTH_STRATEGIES).includes(process.env.AUTH_STRATEGY)) {
      return process.env.AUTH_STRATEGY;
    }
    
    // Par défaut, utiliser JWT
    return AUTH_STRATEGIES.JWT;
  };
  
  /**
   * Récupérer le middleware approprié pour la stratégie d'authentification
   * @param {string} strategy - Stratégie d'authentification à utiliser
   * @returns {Function} Middleware d'authentification
   */
  const getAuthMiddleware = (strategy = null) => {
    const selectedStrategy = determineAuthStrategy(strategy);
    
    switch (selectedStrategy) {
      case AUTH_STRATEGIES.SESSION:
        return require('../middlewares/sessionAuth').sessionProtect;
      case AUTH_STRATEGIES.BASIC:
        return require('../middlewares/basicAuth');
      case AUTH_STRATEGIES.JWT:
      default:
        return require('../middlewares/jwtAuth').protect;
    }
  };
  
  /**
   * Récupérer le middleware d'autorisation approprié pour la stratégie d'authentification
   * @param {string} strategy - Stratégie d'authentification
   * @param {Array} roles - Rôles autorisés
   * @returns {Function} Middleware d'autorisation
   */
  const getAuthorizationMiddleware = (strategy = null, roles = []) => {
    const selectedStrategy = determineAuthStrategy(strategy);
    
    switch (selectedStrategy) {
      case AUTH_STRATEGIES.SESSION:
        return require('../middlewares/sessionAuth').sessionAuthorize(...roles);
      case AUTH_STRATEGIES.JWT:
      default:
        return require('../middlewares/jwtAuth').authorize(...roles);
    }
  };
  
  module.exports = {
    AUTH_STRATEGIES,
    determineAuthStrategy,
    getAuthMiddleware,
    getAuthorizationMiddleware
  };