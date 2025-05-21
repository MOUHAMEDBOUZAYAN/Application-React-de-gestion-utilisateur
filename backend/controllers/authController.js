// controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const UserLog = require('../models/UserLog');
const jwt = require('jsonwebtoken');

/**
 * @desc    Enregistrer un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  
  // Créer l'utilisateur
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm
  });
  
  // Générer un token de vérification d'email
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  
  // URL de vérification
  const verificationURL = `${req.protocol}://${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  const message = `Bienvenue sur notre plateforme! Veuillez cliquer sur le lien suivant pour vérifier votre adresse email: ${verificationURL}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border:1px solid #eee; border-radius:8px; padding:32px;">
      <h2 style="color:#222; text-align:center;">Bienvenue sur notre plateforme!</h2>
      <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${verificationURL}" style="background:#22c55e; color:#fff; padding:12px 32px; border-radius:6px; text-decoration:none; font-size:18px; display:inline-block;">
          Vérifier mon email
        </a>
      </div>
      <p style="color:#555; font-size:14px;">Ce lien expirera dans 24 heures.</p>
    </div>
  `;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Vérification de votre adresse email',
      message,
      html
    });
    
    // Journaliser l'action
    await UserLog.create({
      user: user._id,
      action: 'register',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Création de compte utilisateur'
    });
    
    // Créer un token et répondre
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email de vérification:', err);
    
    // Réinitialiser le token en cas d'erreur
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email de vérification. Veuillez réessayer.', 500));
  }
});

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Valider l'email et le mot de passe
  if (!email || !password) {
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }
  
  // Vérifier si l'utilisateur existe
  const user = await User.findOne({ email }).select('+password +loginAttempts +isLocked');
  
  if (!user) {
    // Journaliser la tentative échouée
    await UserLog.create({
      action: 'login_failed',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Tentative de connexion avec un email inexistant',
      details: { email }
    });
    
    return next(new ErrorResponse('Identifiants invalides', 401));
  }
  
  // Vérifier si le compte est verrouillé
  if (user.isLocked) {
    return next(new ErrorResponse('Votre compte est temporairement verrouillé. Veuillez réessayer plus tard ou contactez le support.', 401));
  }
  
  // Vérifier si le mot de passe correspond
  const isMatch = await user.correctPassword(password, user.password);
  
  if (!isMatch) {
    // Augmenter le compteur de tentatives échouées
    user.loginAttempts += 1;
    
    // Verrouiller le compte après 5 tentatives
    if (user.loginAttempts >= 5) {
      user.isLocked = true;
      
      // Journaliser le verrouillage
      await UserLog.create({
        user: user._id,
        action: 'account_locked',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        description: 'Compte verrouillé après 5 tentatives de connexion échouées'
      });
    }
    
    await user.save({ validateBeforeSave: false });
    
    // Journaliser la tentative échouée
    await UserLog.create({
      user: user._id,
      action: 'login_failed',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Tentative de connexion avec un mot de passe incorrect'
    });
    
    return next(new ErrorResponse('Identifiants invalides', 401));
  }
  
  // Réinitialiser le compteur de tentatives
  user.loginAttempts = 0;
  await user.save({ validateBeforeSave: false });
  
  // Journaliser la connexion réussie
  await UserLog.create({
    user: user._id,
    action: 'login',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'Connexion réussie'
  });
  
  // Créer un token et répondre
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Déconnecter un utilisateur
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Si l'utilisateur est authentifié, journaliser la déconnexion
  if (req.user) {
    await UserLog.create({
      user: req.user.id,
      action: 'logout',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Déconnexion'
    });
  }
  
  // Supprimer le cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 secondes
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Obtenir l'utilisateur actuel
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Mettre à jour les informations de l'utilisateur
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = asyncHandler(async (req, res, next) => {
  // Champs autorisés à mettre à jour
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address
  };
  
  // Empêcher la modification du rôle
  if ('role' in req.body) {
    return next(new ErrorResponse('Modification du rôle interdite', 403));
  }
  
  // Supprimer les champs non fournis
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });
  
  // Si l'email est modifié et déjà vérifié, refuser
  const user = await User.findById(req.user.id);
  if (fieldsToUpdate.email && user.isEmailVerified) {
    return next(new ErrorResponse('Impossible de modifier un email déjà vérifié', 403));
  }
  
  if (fieldsToUpdate.email && fieldsToUpdate.email !== user.email) {
    fieldsToUpdate.isEmailVerified = false;
  }
  
  // Si le téléphone est modifié, réinitialiser la vérification
  if (fieldsToUpdate.phone && fieldsToUpdate.phone !== user.phone) {
    fieldsToUpdate.isPhoneVerified = false;
  }
  
  // Mettre à jour l'utilisateur
  const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  
  // Journaliser l'action
  await UserLog.create({
    user: req.user.id,
    action: 'update_profile',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'Mise à jour des informations du profil'
  });
  
  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

/**
 * @desc    Mettre à jour le mot de passe
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  
  // Vérifier si tous les champs sont fournis
  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(new ErrorResponse('Veuillez fournir tous les champs requis', 400));
  }
  
  // Vérifier si les nouveaux mots de passe correspondent
  if (newPassword !== newPasswordConfirm) {
    return next(new ErrorResponse('Les nouveaux mots de passe ne correspondent pas', 400));
  }
  
  // Récupérer l'utilisateur avec le mot de passe
  const user = await User.findById(req.user.id).select('+password');
  
  // Vérifier si le mot de passe actuel est correct
  const isMatch = await user.correctPassword(currentPassword, user.password);
  
  if (!isMatch) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
  }
  
  // Mettre à jour le mot de passe
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();
  
  // Journaliser l'action
  await UserLog.create({
    user: req.user.id,
    action: 'update_password',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'Mise à jour du mot de passe'
  });
  
  // Créer un nouveau token et répondre
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Mot de passe oublié
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  // Vérifier si l'email est fourni
  if (!email) {
    return next(new ErrorResponse('Veuillez fournir une adresse email', 400));
  }
  
  // Rechercher l'utilisateur
  const user = await User.findOne({ email });
  
  if (!user) {
    return next(new ErrorResponse('Aucun utilisateur trouvé avec cette adresse email', 404));
  }
  
  // Générer un token de réinitialisation
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  // URL de réinitialisation
  const resetURL = `${req.protocol}://${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const message = `
    Vous recevez cet email car vous avez demandé la réinitialisation de votre mot de passe.
    Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe:
    ${resetURL}
    Ce lien expirera dans 10 minutes.
  `;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      message
    });
    
    // Journaliser l'action
    await UserLog.create({
      user: user._id,
      action: 'reset_password',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Demande de réinitialisation de mot de passe'
    });
    
    res.status(200).json({
      success: true,
      message: 'Email envoyé'
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', err);
    
    // Réinitialiser le token en cas d'erreur
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email de réinitialisation. Veuillez réessayer.', 500));
  }
});

/**
 * @desc    Réinitialiser le mot de passe
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hacher le token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');
  
  // Rechercher l'utilisateur avec le token
  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }
  
  // Définir le nouveau mot de passe
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  // Journaliser l'action
  await UserLog.create({
    user: user._id,
    action: 'reset_password',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'Réinitialisation de mot de passe réussie'
  });
  
  // Créer un token et répondre
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Vérifier l'adresse email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Hacher le token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  // Rechercher l'utilisateur avec le token
  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }
  
  // Marquer l'email comme vérifié
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });
  
  // Journaliser l'action
  await UserLog.create({
    user: user._id,
    action: 'verify_email',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    description: 'Vérification d\'email réussie'
  });
  
  res.status(200).json({
    success: true,
    message: 'Email vérifié avec succès'
  });
});

/**
 * @desc    Renvoyer l'email de vérification
 * @route   POST /api/auth/resend-verification-email
 * @access  Private
 */
exports.resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (user.isEmailVerified) {
    return next(new ErrorResponse('Votre email est déjà vérifié', 400));
  }
  
  // Générer un nouveau token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  
  // URL de vérification
  const verificationURL = `${req.protocol}://${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  const message = `Veuillez cliquer sur le lien suivant pour vérifier votre adresse email: ${verificationURL}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border:1px solid #eee; border-radius:8px; padding:32px;">
      <h2 style="color:#222; text-align:center;">Bienvenue sur notre plateforme!</h2>
      <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${verificationURL}" style="background:#22c55e; color:#fff; padding:12px 32px; border-radius:6px; text-decoration:none; font-size:18px; display:inline-block;">
          Vérifier mon email
        </a>
      </div>
      <p style="color:#555; font-size:14px;">Ce lien expirera dans 24 heures.</p>
    </div>
  `;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Vérification de votre adresse email',
      message,
      html
    });
    
    // Journaliser l'action
    await UserLog.create({
      user: user._id,
      action: 'resend_verification_email',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Renvoi d\'email de vérification'
    });
    
    res.status(200).json({
      success: true,
      message: 'Email de vérification renvoyé'
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email de vérification:', err);
    
    // Réinitialiser le token en cas d'erreur
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email de vérification. Veuillez réessayer.', 500));
  }
});

/**
 * @desc    Vérifier le numéro de téléphone
 * @route   POST /api/auth/verifyphone
 * @access  Private
 */
exports.verifyPhone = async (req, res, next) => {
  try {
    const { verificationCode } = req.body;
    
    if (!verificationCode) {
      return res.status(400).json({
        status: 'fail',
        error: 'Veuillez fournir un code de vérification'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user.phone) {
      return res.status(400).json({
        status: 'fail',
        error: 'Aucun numéro de téléphone à vérifier'
      });
    }
    
    if (user.isPhoneVerified) {
      return res.status(400).json({
        status: 'fail',
        error: 'Votre numéro de téléphone est déjà vérifié'
      });
    }
    
    // Vérifier le code
    if (!user.phoneVerificationCode || user.phoneVerificationCode !== verificationCode) {
      return res.status(400).json({
        status: 'fail',
        error: 'Code de vérification invalide'
      });
    }
    
    // Vérifier si le code n'a pas expiré
    if (user.phoneVerificationExpires < Date.now()) {
      return res.status(400).json({
        status: 'fail',
        error: 'Code de vérification expiré'
      });
    }
    
    // Marquer le téléphone comme vérifié
    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      status: 'success',
      message: 'Numéro de téléphone vérifié avec succès'
    });
  } catch (err) {
    console.error('Erreur lors de la vérification du numéro de téléphone:', err);
    res.status(500).json({
      status: 'error',
      error: 'Une erreur est survenue lors de la vérification du numéro de téléphone.'
    });
  }
};

/**
 * @desc    Renvoyer le SMS de vérification
 * @route   POST /api/auth/resendverificationsms
 * @access  Private
 */
exports.resendVerificationSMS = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.phone) {
      return res.status(400).json({
        status: 'fail',
        error: 'Aucun numéro de téléphone à vérifier'
      });
    }
    
    if (user.isPhoneVerified) {
      return res.status(400).json({
        status: 'fail',
        error: 'Votre numéro de téléphone est déjà vérifié'
      });
    }
    
    // Générer un nouveau code de vérification
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres
    
    // Sauvegarder le code et définir une expiration (10 minutes)
    user.phoneVerificationCode = verificationCode;
    user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    
    // TODO: Intégrer un service d'envoi de SMS (Twilio, Nexmo, etc.)
    // Pour l'instant, simuler l'envoi du SMS et retourner le code dans la réponse pour le développement
    console.log(`Code de vérification pour ${user.phone}: ${verificationCode}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Code de vérification envoyé avec succès',
      // En développement seulement, ne pas inclure en production
      code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi du SMS de vérification:', err);
    res.status(500).json({
      status: 'error',
      error: 'Une erreur est survenue lors de l\'envoi du SMS de vérification.'
    });
  }
};

/**
 * @desc    Vérifier la disponibilité d'un email
 * @route   POST /api/auth/check-email
 * @access  Public
 */
exports.checkEmailAvailability = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'fail',
        error: 'Veuillez fournir une adresse email'
      });
    }
    
    const existingUser = await User.findOne({ email });
    
    res.status(200).json({
      status: 'success',
      available: !existingUser
    });
  } catch (err) {
    console.error('Erreur lors de la vérification de la disponibilité de l\'email:', err);
    res.status(500).json({
      status: 'error',
      error: 'Une erreur est survenue lors de la vérification de la disponibilité de l\'email.'
    });
  }
};

/**
 * @desc    Point d'entrée pour vérifier l'état du serveur
 * @route   GET /api/health
 * @access  Public
 */
exports.healthCheck = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Le serveur fonctionne correctement',
    timestamp: new Date().toISOString()
  });
};

/**
 * @desc    Créer un token, le stocker dans un cookie et envoyer la réponse
 * @param   {Object} user - Utilisateur pour lequel créer le token
 * @param   {number} statusCode - Code HTTP à retourner
 * @param   {Object} res - Objet réponse Express
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Créer un token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
  
  // Options du cookie
  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  
  // Secure en production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  
  // Envoyer le cookie
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    });
};

/**
 * @desc    Renvoyer l'email de vérification (version publique)
 * @route   POST /api/auth/public/resendverification
 * @access  Public
 */
exports.resendPublicVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Veuillez fournir une adresse email', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('Aucun utilisateur trouvé avec cette adresse email', 404));
  }

  if (user.isEmailVerified) {
    return next(new ErrorResponse('Cet email est déjà vérifié', 400));
  }

  // Générer un nouveau token de vérification
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // URL de vérification
  const verificationURL = `${req.protocol}://${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const message = `Veuillez cliquer sur le lien suivant pour vérifier votre adresse email: ${verificationURL}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border:1px solid #eee; border-radius:8px; padding:32px;">
      <h2 style="color:#222; text-align:center;">Bienvenue sur notre plateforme!</h2>
      <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${verificationURL}" style="background:#22c55e; color:#fff; padding:12px 32px; border-radius:6px; text-decoration:none; font-size:18px; display:inline-block;">
          Vérifier mon email
        </a>
      </div>
      <p style="color:#555; font-size:14px;">Ce lien expirera dans 24 heures.</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Vérification de votre adresse email',
      message,
      html
    });

    // Journaliser l'action
    await UserLog.create({
      user: user._id,
      action: 'resend_verification_email',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      description: 'Renvoyé l\'email de vérification (version publique)'
    });

    res.status(200).json({
      success: true,
      message: 'Email de vérification envoyé'
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email de vérification:', err);

    // Réinitialiser le token en cas d'erreur
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email de vérification. Veuillez réessayer.', 500));
  }
});

module.exports = exports;