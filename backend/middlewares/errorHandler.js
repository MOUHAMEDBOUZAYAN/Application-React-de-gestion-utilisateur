// middlewares/errorHandler.js
// Middleware de gestion globale des erreurs

const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log pour le développeur
  console.error('ERREUR DÉTAILLÉE:', err);

  // Erreur de validation de Mongoose (champs requis)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // Erreur de duplication Mongoose (email déjà utilisé)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Valeur du champ "${field}" déjà utilisée. Veuillez en choisir une autre.`;
    error = new ErrorResponse(message, 400);
  }

  // Erreur d'ID Mongoose invalide
  if (err.name === 'CastError') {
    const message = `Ressource avec l'ID ${err.value} non trouvée`;
    error = new ErrorResponse(message, 404);
  }

  // Erreur de validation JWT
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Non autorisé. Token invalide.', 401);
  }

  // Erreur d'expiration JWT
  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Non autorisé. Token expiré.', 401);
  }

  // Répondre avec le code d'état et le message d'erreur appropriés
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur serveur'
  });
};

module.exports = errorHandler;