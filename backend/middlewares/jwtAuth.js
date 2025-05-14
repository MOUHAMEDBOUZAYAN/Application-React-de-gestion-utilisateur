// middlewares/jwtAuth.js
// Middleware d'authentification JWT

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./asyncHandler');

// Protéger les routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Vérifier si le token existe dans les headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Récupérer le token du header Authorization
    token = req.headers.authorization.split(' ')[1];
  } 
  // Ou si le token existe dans les cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Vérifier si le token existe
  if (!token) {
    return next(new ErrorResponse('Non autorisé à accéder à cette route', 401));
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    // Vérifier si le compte est verrouillé
    if (user.accountLocked) {
      return next(new ErrorResponse('Compte verrouillé. Veuillez contacter l\'administrateur', 403));
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Non autorisé à accéder à cette route', 401));
  }
});

// Autorisation par rôle
const authorize = (...roles) => {
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
  protect,
  authorize
};