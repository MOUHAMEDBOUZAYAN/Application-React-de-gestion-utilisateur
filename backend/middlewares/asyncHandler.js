// middlewares/asyncHandler.js
// Helper pour gérer les erreurs dans les fonctions asynchrones

/**
 * Wrapper pour gérer les erreurs dans les fonctions middleware asynchrones
 * Évite d'avoir à utiliser try/catch dans chaque contrôleur
 * @param {Function} fn - Fonction middleware asynchrone
 * @returns {Function} Middleware avec gestion d'erreur
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;