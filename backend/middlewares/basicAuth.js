// middlewares/basicAuth.js
// Middleware d'authentification HTTP Basic

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./asyncHandler');

const basicAuth = asyncHandler(async (req, res, next) => {
  // Vérifier si le header Authorization est présent
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return next(new ErrorResponse('Non autorisé - authentification Basic requise', 401));
  }
  
  try {
    // Décoder les informations d'authentification
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [email, password] = credentials.split(':');
    
    if (!email || !password) {
      return next(new ErrorResponse('Email et mot de passe requis', 400));
    }
    
    // Rechercher l'utilisateur
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('Identifiants invalides', 401));
    }
    
    // Vérifier si le compte est verrouillé
    if (user.accountLocked) {
      return next(new ErrorResponse('Compte verrouillé. Veuillez contacter l\'administrateur', 403));
    }
    
    // Vérifier le mot de passe
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      // Incrémenter le compteur de tentatives de connexion
      await user.incrementLoginAttempts();
      
      return next(new ErrorResponse('Identifiants invalides', 401));
    }
    
    // Réinitialiser le compteur de tentatives de connexion
    await user.resetLoginAttempts();
    
    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (err) {
    console.error('Erreur d\'authentification Basic:', err);
    return next(new ErrorResponse('Erreur d\'authentification', 500));
  }
});

module.exports = basicAuth;