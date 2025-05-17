// utils/errorResponse.js
// Classe pour créer des réponses d'erreur standardisées

/**
 * Classe pour les réponses d'erreur
 * @extends Error
 */
class ErrorResponse extends Error {
  /**
   * Créer une instance ErrorResponse
   * @param {string} message - Message d'erreur
   * @param {number} statusCode - Code HTTP de l'erreur
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;