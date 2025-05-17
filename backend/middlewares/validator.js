// middlewares/validator.js - Mise à jour avec validations plus strictes

const { body, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

// Traiter les résultats de validation
const validationMiddleware = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return next(new ErrorResponse(errorMessages.join(', '), 400));
    }
    next();
  } catch (error) {
    console.error('Erreur dans le middleware de validation:', error);
    next(new ErrorResponse('Erreur de validation', 500));
  }
};

// Règles de validation pour l'inscription
const registerValidationRules = [
  // Nom
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit comporter entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne doit contenir que des lettres, espaces, apostrophes et tirets')
    .escape(),
  
  // Email
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Veuillez fournir un email valide')
    .normalizeEmail({ gmail_remove_dots: false }),
  
  // Mot de passe
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit comporter au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  
  // Confirmation de mot de passe
  body('passwordConfirm')
    .notEmpty().withMessage('La confirmation du mot de passe est requise')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    }),
  
  // Rôle (optionnel)
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Le rôle doit être "user" ou "admin"'),
  
  // Téléphone (optionnel)
  body('phone')
    .optional()
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Veuillez fournir un numéro de téléphone valide (10-15 chiffres)')
];

// Règles de validation pour la connexion
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Veuillez fournir un email valide')
    .normalizeEmail({ gmail_remove_dots: false }),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
];

// Règles de validation pour la réinitialisation du mot de passe
const resetPasswordValidationRules = [
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit comporter au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  
  body('passwordConfirm')
    .notEmpty().withMessage('La confirmation du mot de passe est requise')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

// Règles de validation pour la mise à jour du profil
const updateProfileValidationRules = [
  // Nom (optionnel)
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit comporter entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne doit contenir que des lettres, espaces, apostrophes et tirets')
    .escape(),
  
  // Email (optionnel)
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Veuillez fournir un email valide')
    .normalizeEmail({ gmail_remove_dots: false }),
  
  // Téléphone (optionnel)
  body('phone')
    .optional()
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Veuillez fournir un numéro de téléphone valide (10-15 chiffres)')
];

// Règles de validation pour la mise à jour du mot de passe
const updatePasswordValidationRules = [
  body('currentPassword')
    .notEmpty().withMessage('Le mot de passe actuel est requis'),
  
  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit comporter au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'actuel');
      }
      return true;
    }),
  
  body('passwordConfirm')
    .notEmpty().withMessage('La confirmation du mot de passe est requise')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

// Règles de validation pour la vérification du téléphone
const phoneVerificationRules = [
  body('verificationCode')
    .notEmpty().withMessage('Le code de vérification est requis')
    .isLength({ min: 6, max: 6 }).withMessage('Le code de vérification doit comporter 6 chiffres')
    .isNumeric().withMessage('Le code de vérification doit être numérique')
];

module.exports = {
  validationMiddleware,
  registerValidationRules,
  loginValidationRules,
  resetPasswordValidationRules,
  updateProfileValidationRules,
  updatePasswordValidationRules,
  phoneVerificationRules
};