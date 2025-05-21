module.exports = (req, res, next) => {
  if (!req.user.isEmailVerified && !req.user.isPhoneVerified) {
    return res.status(403).json({ message: 'Veuillez vérifier votre email ou téléphone.' });
  }
  next();
}; 