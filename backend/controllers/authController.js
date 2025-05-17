// controllers/authController.js
// Contrôleur pour l'authentification des utilisateurs

const crypto = require('crypto');
const User = require('../models/User');
const UserLog = require('../models/UserLog');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Vérifier si l'email et le mot de passe ont été fournis
  if (!email || !password) {
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  // Vérifier si l'utilisateur existe
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    // Incrémenter un compteur global de tentatives échouées (pour limiter les attaques)
    // Cela pourrait être implémenté avec Redis ou équivalent
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Vérifier si le compte est verrouillé
  if (user.accountLocked) {
    return next(new ErrorResponse('Votre compte est verrouillé. Veuillez contacter l\'administrateur', 403));
  }

  // Vérifier si le mot de passe correspond
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Incrémenter le compteur de tentatives de connexion
    await user.incrementLoginAttempts();
    
    // Journaliser la tentative de connexion échouée
    await UserLog.create({
      user: user._id,
      action: 'login_failed',
      description: `Tentative de connexion échouée pour ${user.email}`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Réinitialiser le compteur de tentatives de connexion
  await user.resetLoginAttempts();

  // Journaliser la connexion réussie
  await UserLog.create({
    user: user._id,
    action: 'login',
    description: `${user.email} s'est connecté`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  sendTokenResponse(user, 200, res, req);
});

// @desc    Déconnexion / effacement du cookie
// @route   GET /api/auth/logout
// @access  Public
exports.logout = asyncHandler(async (req, res, next) => {
  // Si nous utilisons des sessions
  if (req.session) {
    req.session.destroy();
  }

  // Effacer le cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 secondes
    httpOnly: true
  });

  // Si un utilisateur est connecté, journaliser la déconnexion
  if (req.user) {
    await UserLog.create({
      user: req.user._id,
      action: 'logout',
      description: `${req.user.email} s'est déconnecté`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir les informations de l'utilisateur actuel
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Mot de passe oublié
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Veuillez fournir un email', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Ne pas révéler si l'utilisateur existe ou non pour des raisons de sécurité
    return res.status(200).json({
      success: true,
      message: 'Si un compte existe avec cet email, un email de réinitialisation a été envoyé'
    });
  }

  // Générer le token de réinitialisation
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Créer l'URL de réinitialisation
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
  // Pour le frontend
  const frontendResetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `
    Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation du mot de passe.
    Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe :
    \n\n${frontendResetUrl}\n\n
    Ce lien expirera dans 10 minutes.
    Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      message,
      html: `
        <p>Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation du mot de passe.</p>
        <p>Veuillez cliquer sur le bouton suivant pour réinitialiser votre mot de passe :</p>
        <p>
          <a href="${frontendResetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Réinitialiser le mot de passe
          </a>
        </p>
        <p>Ce lien expirera dans 10 minutes.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
      `
    });

    // Journaliser la demande de réinitialisation
    await UserLog.create({
      user: user._id,
      action: 'forgot_password',
      description: `Demande de réinitialisation de mot de passe pour ${user.email}`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });
  } catch (err) {
    console.error('Erreur d\'envoi d\'email:', err);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.', 500));
  }
});

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Récupérer le token depuis l'URL et le hacher
  const resetToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // Trouver l'utilisateur avec le token et vérifier qu'il n'a pas expiré
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }

  // Définir le nouveau mot de passe
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();

  // Journaliser la réinitialisation
  await UserLog.create({
    user: user._id,
    action: 'reset_password',
    description: `Réinitialisation de mot de passe pour ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Connecter l'utilisateur et renvoyer un token
  sendTokenResponse(user, 200, res, req);
});

// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  // Récupérer l'utilisateur avec le mot de passe
  const user = await User.findById(req.user.id).select('+password');

  // Vérifier le mot de passe actuel
  const isMatch = await user.matchPassword(req.body.currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
  }

  // Définir le nouveau mot de passe
  user.password = req.body.newPassword;
  await user.save();

  // Journaliser la mise à jour
  await UserLog.create({
    user: user._id,
    action: 'update_password',
    description: `Mise à jour du mot de passe pour ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Connecter l'utilisateur et renvoyer un token
  sendTokenResponse(user, 200, res, req);
});

// @desc    Mettre à jour les informations du profil
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  // Récupérer l'utilisateur
  const user = await User.findById(req.user.id);

  // Données à mettre à jour
  const fieldsToUpdate = {};

  // Mise à jour du nom
  if (req.body.name) {
    fieldsToUpdate.name = req.body.name;
  }

  // Mise à jour de l'email (nécessite une vérification)
  if (req.body.email && req.body.email !== user.email) {
    // Vérifier si l'email est déjà utilisé
    const emailExists = await User.findOne({ email: req.body.email });
    
    if (emailExists) {
      return next(new ErrorResponse('Cet email est déjà utilisé', 400));
    }
    
    // Stocker temporairement le nouvel email
    user._newEmail = req.body.email;
    
    // Générer un token de vérification
    const emailVerificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Créer l'URL de vérification
    const verifyEmailUrl = `${req.protocol}://${req.get('host')}/api/auth/verifynewemail/${emailVerificationToken}`;
    const frontendVerifyUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;

    const message = `
      Veuillez cliquer sur le lien suivant pour vérifier votre nouvelle adresse email:
      \n\n${frontendVerifyUrl}\n\n
      Ce lien expirera dans 24 heures.
    `;

    try {
      await sendEmail({
        email: req.body.email, // Envoyer à la nouvelle adresse
        subject: 'Vérification de votre nouvelle adresse email',
        message,
        html: `
          <p>Veuillez cliquer sur le bouton suivant pour vérifier votre nouvelle adresse email:</p>
          <p>
            <a href="${frontendVerifyUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Vérifier mon email
            </a>
          </p>
          <p>Ce lien expirera dans 24 heures.</p>
        `
      });
    } catch (error) {
      console.error('Erreur d\'envoi d\'email:', error);
      
      user._newEmail = undefined;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email de vérification', 500));
    }
  }

  // Mise à jour du téléphone (nécessite une vérification)
  if (req.body.phone && req.body.phone !== user.phone) {
    // Vérifier si le téléphone est déjà utilisé
    const phoneExists = await User.findOne({ phone: req.body.phone });
    
    if (phoneExists) {
      return next(new ErrorResponse('Ce numéro de téléphone est déjà utilisé', 400));
    }
    
    // Stocker temporairement le nouveau téléphone
    user._newPhone = req.body.phone;
    
    // Générer un code de vérification
    const phoneVerificationCode = user.getPhoneVerificationCode();
    await user.save({ validateBeforeSave: false });

    // Envoyer le code par SMS
    try {
      await sendSMS({
        to: req.body.phone,
        message: `Votre code de vérification pour 404.js est: ${phoneVerificationCode}. Il expirera dans 10 minutes.`
      });
    } catch (error) {
      console.error('Erreur d\'envoi de SMS:', error);
      
      user._newPhone = undefined;
      user.phoneVerificationCode = undefined;
      user.phoneVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Erreur lors de l\'envoi du SMS de vérification', 500));
    }
  }

  // Mettre à jour les champs qui ne nécessitent pas de vérification
  const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  // Journaliser la mise à jour
  await UserLog.create({
    user: user._id,
    action: 'update_profile',
    description: `Mise à jour du profil pour ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    details: { updatedFields: Object.keys(fieldsToUpdate) }
  });

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: req.body.email !== user.email || req.body.phone !== user.phone 
      ? 'Profil mis à jour. Veuillez vérifier votre email ou téléphone pour confirmer les modifications.'
      : 'Profil mis à jour avec succès.'
  });
});

// @desc    Vérifier le nouveau email
// @route   GET /api/auth/verifynewemail/:token
// @access  Public
exports.verifyNewEmail = asyncHandler(async (req, res, next) => {
  // Récupérer le token depuis l'URL et le hacher
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Trouver l'utilisateur avec le token et vérifier qu'il n'a pas expiré
  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token de vérification invalide ou expiré', 400));
  }

  // Vérifier si un nouvel email est en attente
  if (!user._newEmail) {
    return next(new ErrorResponse('Aucun nouvel email en attente de vérification', 400));
  }

  // Mettre à jour l'email
  user.email = user._newEmail;
  user._newEmail = undefined;
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  
  await user.save();

  // Journaliser la vérification
  await UserLog.create({
    user: user._id,
    action: 'verify_new_email',
    description: `Nouvel email vérifié: ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Rediriger vers le frontend avec un message de succès
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/email-verified?success=true`);
});

// Fonction helper pour envoyer le token de réponse
const sendTokenResponse = (user, statusCode, res, req) => {
  // Créer token JWT
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

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        phone: user.phone
      }
    });
};