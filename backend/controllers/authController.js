// controllers/authController.js - Ajouts pour gestion des vérifications
// Ces fonctions s'ajoutent aux fonctions existantes

// Ajouter ces imports au début du fichier
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const logger = require('../middlewares/logger');

// @desc    Inscrire un nouvel utilisateur avec vérification
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  // Extraire toutes les données du corps de la requête
  const { name, email, password, passwordConfirm, role, phone } = req.body;

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

    // Vérifier si le téléphone existe déjà (si fourni)
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return next(new ErrorResponse('Ce numéro de téléphone est déjà utilisé', 400));
      }
    }

    // Créer un nouvel utilisateur
    const userData = {
      name,
      email,
      password,
      phone
    };

    // Vérifier si le rôle est spécifié et l'ajouter à l'objet userData
    if (role && (role === 'admin' || role === 'user')) {
      userData.role = role;
      console.log(`Création d'un utilisateur avec le rôle spécifié: ${role}`);
    }

    // Créer l'utilisateur
    const user = await User.create(userData);

    // Générer un token de vérification d'email
    const emailVerificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Créer l'URL de vérification d'email
    const verifyEmailUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${emailVerificationToken}`;

    // Préparer le message d'email
    const message = `
      Merci pour votre inscription! Veuillez cliquer sur le lien suivant pour vérifier votre adresse email:
      \n\n${verifyEmailUrl}\n\n
      Ce lien expirera dans 24 heures.
    `;

    try {
      // Envoyer l'email de vérification
      await sendEmail({
        email: user.email,
        subject: 'Vérification de votre adresse email',
        message,
        html: `<p>Merci pour votre inscription!</p>
               <p>Veuillez cliquer sur le lien suivant pour vérifier votre adresse email:</p>
               <p><a href="${verifyEmailUrl}">Vérifier mon email</a></p>
               <p>Ce lien expirera dans 24 heures.</p>`
      });

      // Si un numéro de téléphone est fourni, envoyer également un code de vérification par SMS
      if (phone) {
        const phoneVerificationCode = user.getPhoneVerificationCode();
        await user.save({ validateBeforeSave: false });

        await sendSMS({
          to: user.phone,
          message: `Votre code de vérification pour 404.js est: ${phoneVerificationCode}. Il expirera dans 10 minutes.`
        });
      }

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

      res.status(201)
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
          },
          message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.'
        });
    } catch (error) {
      console.error('Erreur d\'envoi de vérification:', error);
      
      // Supprimer les tokens de vérification en cas d'erreur
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      user.phoneVerificationCode = undefined;
      user.phoneVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email de vérification. Veuillez réessayer.', 500));
    }
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    next(error);
  }
});

// @desc    Vérifier l'adresse email
// @route   GET /api/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
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

  // Marquer l'email comme vérifié
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  
  await user.save();

  // Journaliser l'action
  await UserLog.create({
    user: user._id,
    action: 'verify_email',
    description: `L'adresse email ${user.email} a été vérifiée`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Rediriger vers le frontend avec un message de succès
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/email-verified?success=true`);
});

// @desc    Vérifier le code SMS
// @route   POST /api/auth/verifyphone
// @access  Private
exports.verifyPhone = asyncHandler(async (req, res, next) => {
  const { verificationCode } = req.body;

  if (!verificationCode) {
    return next(new ErrorResponse('Veuillez fournir le code de vérification', 400));
  }

  const user = await User.findById(req.user.id);

  // Vérifier si un code existe et n'a pas expiré
  if (!user.phoneVerificationCode || 
      !user.phoneVerificationExpire || 
      user.phoneVerificationExpire < Date.now()) {
    return next(new ErrorResponse('Code de vérification invalide ou expiré', 400));
  }

  // Vérifier si le code correspond
  if (user.phoneVerificationCode !== verificationCode) {
    return next(new ErrorResponse('Code de vérification incorrect', 400));
  }

  // Marquer le téléphone comme vérifié
  user.isPhoneVerified = true;
  user.phoneVerificationCode = undefined;
  user.phoneVerificationExpire = undefined;
  
  await user.save();

  // Journaliser l'action
  await UserLog.create({
    user: user._id,
    action: 'verify_phone',
    description: `Le numéro de téléphone ${user.phone} a été vérifié`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Numéro de téléphone vérifié avec succès'
  });
});

// @desc    Renvoyer l'email de vérification
// @route   POST /api/auth/resendverificationemail
// @access  Private
exports.resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new ErrorResponse('Email déjà vérifié', 400));
  }

  // Générer un nouveau token de vérification
  const emailVerificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Créer l'URL de vérification
  const verifyEmailUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${emailVerificationToken}`;

  // Préparer le message
  const message = `
    Veuillez cliquer sur le lien suivant pour vérifier votre adresse email:
    \n\n${verifyEmailUrl}\n\n
    Ce lien expirera dans 24 heures.
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Vérification de votre adresse email',
      message,
      html: `<p>Veuillez cliquer sur le lien suivant pour vérifier votre adresse email:</p>
             <p><a href="${verifyEmailUrl}">Vérifier mon email</a></p>
             <p>Ce lien expirera dans 24 heures.</p>`
    });

    // Journaliser l'action
    await UserLog.create({
      user: user._id,
      action: 'resend_verification_email',
      description: `Email de vérification renvoyé à ${user.email}`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Email de vérification renvoyé'
    });
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.', 500));
  }
});

// @desc    Renvoyer un code de vérification par SMS
// @route   POST /api/auth/resendverificationsms
// @access  Private
exports.resendVerificationSMS = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.phone) {
    return next(new ErrorResponse('Aucun numéro de téléphone enregistré', 400));
  }

  if (user.isPhoneVerified) {
    return next(new ErrorResponse('Numéro de téléphone déjà vérifié', 400));
  }

  // Générer un nouveau code de vérification
  const phoneVerificationCode = user.getPhoneVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    await sendSMS({
      to: user.phone,
      message: `Votre code de vérification pour 404.js est: ${phoneVerificationCode}. Il expirera dans 10 minutes.`
    });

    // Journaliser l'action
    await UserLog.create({
      user: user._id,
      action: 'resend_verification_sms',
      description: `SMS de vérification renvoyé à ${user.phone}`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Code de vérification envoyé par SMS'
    });
  } catch (error) {
    console.error('Erreur d\'envoi de SMS:', error);
    
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Erreur lors de l\'envoi du SMS. Veuillez réessayer.', 500));
  }
});