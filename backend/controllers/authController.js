// controllers/authController.js

const crypto = require('crypto');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Inscrire un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  // Extraire toutes les données du corps de la requête
  const { name, email, password, passwordConfirm, role } = req.body;

  // Vérifier si les mots de passe correspondent
  if (password !== passwordConfirm) {
    return next(new ErrorResponse('La confirmation du mot de passe est requise, Les mots de passe ne correspondent pas', 400));
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ErrorResponse('Cet email est déjà utilisé', 400));
    }

    // Créer un nouvel utilisateur avec le rôle spécifié
    const userData = {
      name,
      email,
      password
    };

    // Vérifier si le rôle est spécifié et l'ajouter à l'objet userData
    // S'assurer que le rôle 'admin' est accepté
    if (role && (role === 'admin' || role === 'user')) {
      userData.role = role;
      console.log(`Création d'un utilisateur avec le rôle spécifié: ${role}`);
    } else {
      console.log('Aucun rôle spécifié ou rôle invalide, utilisation du rôle par défaut: user');
    }

    // Log pour debug
    console.log('Création d\'un nouvel utilisateur avec les données:', {
      name,
      email,
      role: userData.role || 'user (par défaut)',
      passwordProvided: !!password,
      passwordConfirmProvided: !!passwordConfirm
    });

    // Créer l'utilisateur
    const user = await User.create(userData);

    // Vérifier que le rôle a été correctement sauvegardé
    console.log(`Utilisateur créé avec le rôle: ${user.role}`);

    // Envoyer le token dans la réponse
    const token = user.getSignedJwtToken();

    // Options du cookie
    const options = {
      expires: new Date(
        Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000 // conversion en ms
      ),
      httpOnly: true
    };

    // Sécuriser les cookies en production
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // Créer la session si activée
    const useSession = process.env.USE_SESSION === 'true';
    if (useSession && req.session) {
      req.session.userId = user._id;
    }

    // Répondre avec l'utilisateur créé
    console.log('Utilisateur créé avec succès:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.status(201)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    next(error);
  }
});

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Vérifier si l'email et le mot de passe sont fournis
  if (!email || !password) {
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Identifiants invalides', 401));
    }

    // Vérifier si le compte est verrouillé
    if (user.accountLocked) {
      return next(new ErrorResponse('Compte verrouillé. Veuillez contacter l\'administrateur', 403));
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Incrémenter le compteur de tentatives de connexion
      await user.incrementLoginAttempts();
      
      return next(new ErrorResponse('Identifiants invalides', 401));
    }

    // Réinitialiser le compteur de tentatives en cas de succès
    await user.resetLoginAttempts();

    // Créer token
    const token = user.getSignedJwtToken();

    // Options du cookie
    const options = {
      expires: new Date(
        Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    // Sécuriser les cookies en production
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // Créer la session si activée
    const useSession = process.env.USE_SESSION === 'true';
    if (useSession && req.session) {
      req.session.userId = user._id;
    }

    // Console log pour le debug
    console.log('Utilisateur connecté:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    next(error);
  }
});

// @desc    Déconnexion utilisateur / Effacer le cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Effacer le cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 secondes
    httpOnly: true
  });

  // Détruire la session si elle existe
  if (req.session) {
    req.session.destroy();
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir l'utilisateur actuellement connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // Ajouter des logs pour le debug
  console.log('Utilisateur récupéré:', {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });

  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Mettre à jour les détails de l'utilisateur
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  // S'assurer que seuls les champs non vides sont mis à jour
  Object.keys(fieldsToUpdate).forEach(key => {
    if (!fieldsToUpdate[key]) {
      delete fieldsToUpdate[key];
    }
  });

  // Vérifier s'il y a des champs à mettre à jour
  if (Object.keys(fieldsToUpdate).length === 0) {
    return next(new ErrorResponse('Aucun champ à mettre à jour', 400));
  }

  // Mettre à jour l'utilisateur
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Récupérer l'utilisateur avec le mot de passe
  const user = await User.findById(req.user.id).select('+password');

  // Vérifier le mot de passe actuel
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
  }

  // Définir le nouveau mot de passe
  user.password = newPassword;
  await user.save();

  // Créer un nouveau token
  const token = user.getSignedJwtToken();

  // Options du cookie
  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Sécuriser les cookies en production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(200)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
});

// @desc    Demander la réinitialisation du mot de passe
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Vérifier si l'utilisateur existe
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse('Aucun utilisateur avec cet email', 404));
  }

  // Générer un token de réinitialisation
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Créer l'URL de réinitialisation
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  // Préparer le message email
  const message = `
    Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation de votre mot de passe.
    Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe :
    \n\n${resetUrl}\n\n
    Ce lien expirera dans 10 minutes.
    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
  `;

  try {
    // Pour ce test, on va simplement simuler l'envoi d'email
    console.log('Email de réinitialisation envoyé à:', user.email);
    console.log('URL de réinitialisation:', resetUrl);

    res.status(200).json({
      success: true,
      data: 'Email envoyé'
    });
  } catch (err) {
    console.error('Erreur d\'envoi d\'email:', err);
    
    // Réinitialiser les champs de réinitialisation
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('L\'email n\'a pas pu être envoyé', 500));
  }
});

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Récupérer le token depuis l'URL et le hacher
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // Trouver l'utilisateur avec le token et vérifier qu'il n'a pas expiré
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }

  // Définir le nouveau mot de passe
  user.password = req.body.password;
  
  // Effacer les champs de réinitialisation
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();

  // Créer un nouveau token
  const token = user.getSignedJwtToken();

  // Options du cookie
  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Sécuriser les cookies en production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(200)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
});

// @desc    Vérifier l'état du compte utilisateur
// @route   GET /api/auth/status
// @access  Private
exports.getAccountStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      accountLocked: user.accountLocked,
      loginAttempts: user.loginAttempts,
      lastLogin: user.lastLogin
    }
  });
});

// @desc    Déverrouiller un compte utilisateur (admin seulement)
// @route   PUT /api/auth/unlock/:userId
// @access  Private/Admin
exports.unlockAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new ErrorResponse(`Utilisateur non trouvé avec l'ID ${req.params.userId}`, 404));
  }

  // Déverrouiller le compte
  user.accountLocked = false;
  user.loginAttempts = 0;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      message: `Compte de ${user.email} déverrouillé avec succès`
    }
  });
});