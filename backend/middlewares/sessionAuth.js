// middlewares/sessionAuth.js
// Middleware d'authentification par session

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./asyncHandler');

// Middleware de protection des routes par session
const sessionProtect = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est connecté via session
  if (!req.session || !req.session.userId) {
    return next(new ErrorResponse('Non autorisé - veuillez vous connecter', 401));
  }

  try {
    // Récupérer l'utilisateur à partir de l'ID de session
    const user = await User.findById(req.session.userId);

    if (!user) {
      // Détruire la session si l'utilisateur n'existe plus
      req.session.destroy();
      return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    // Vérifier si le compte est verrouillé
    if (user.accountLocked) {
      req.session.destroy();
      return next(new ErrorResponse('Compte verrouillé. Veuillez contacter l\'administrateur', 403));
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (err) {
    console.error('Erreur d\'authentification par session:', err);
    return next(new ErrorResponse('Erreur d\'authentification', 500));
  }
});

// Middleware d'autorisation par rôle
const sessionAuthorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Non autorisé - authentification requise', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette route`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  sessionProtect,
  sessionAuthorize
};