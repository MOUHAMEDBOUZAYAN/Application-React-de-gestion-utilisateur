// utils/errorResponse.js
// Classe personnalisée pour les réponses d'erreur

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;