// controllers/authController.js
// Ajouter cette nouvelle méthode au bon endroit (après les imports et avant les autres fonctions)

/**
 * @desc    Renvoyer un email de vérification (route publique)
 * @route   POST /api/auth/public/resendverification
 * @access  Public
 */
exports.resendPublicVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new ErrorResponse('L\'adresse email est requise', 400));
  }
  
  // Rechercher l'utilisateur par email
  const user = await User.findOne({ email });
  
  if (!user) {
    return next(new ErrorResponse('Aucun utilisateur trouvé avec cette adresse email', 404));
  }
  
  // Si l'email est déjà vérifié
  if (user.isEmailVerified) {
    return next(new ErrorResponse('Cet email est déjà vérifié', 400));
  }
  
  // Générer un nouveau token de vérification
  const emailVerificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  
  // Créer l'URL de vérification
  const verifyEmailUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${emailVerificationToken}`;
  const frontendVerifyUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
  
  const message = `
    Veuillez cliquer sur le lien suivant pour vérifier votre adresse email:
    \n\n${frontendVerifyUrl}\n\n
    Ce lien expirera dans 24 heures.
  `;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Vérification de votre adresse email',
      message,
      html: `
        <p>Veuillez cliquer sur le bouton suivant pour vérifier votre adresse email:</p>
        <p>
          <a href="${frontendVerifyUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Vérifier mon email
          </a>
        </p>
        <p>Ce lien expirera dans 24 heures.</p>
      `
    });
    
    // Journaliser l'envoi
    await UserLog.create({
      user: user._id,
      action: 'resend_verification_email',
      description: `Nouvel email de vérification envoyé à ${user.email} (route publique)`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: `Email de vérification envoyé à ${user.email}`
    });
  } catch (err) {
    console.error('Erreur d\'envoi d\'email:', err);
    
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Erreur lors de l\'envoi de l\'email de vérification', 500));
  }
});