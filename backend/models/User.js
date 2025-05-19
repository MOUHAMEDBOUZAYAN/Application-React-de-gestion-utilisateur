// src/models/User.js
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez fournir votre nom'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez fournir votre adresse email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Veuillez fournir une adresse email valide']
  },
  phone: {
    type: String,
    validate: {
      validator: function(value) {
        // Valider le format de téléphone international (ex: +33612345678)
        if (!value) return true; // Optionnel
        return /^\+[1-9]\d{10,14}$/.test(value);
      },
      message: 'Veuillez fournir un numéro de téléphone valide au format international (ex: +33612345678)'
    }
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false // Ne pas inclure dans les requêtes par défaut
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Veuillez confirmer votre mot de passe'],
    validate: {
      // Cette validation ne fonctionne que sur CREATE et SAVE
      validator: function(el) {
        return el === this.password;
      },
      message: 'Les mots de passe ne correspondent pas'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Le rôle doit être user ou admin'
    },
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  address: {
    type: String,
    trim: true
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  phoneVerificationCode: String,
  phoneVerificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Mise à jour du champ updatedAt avant chaque sauvegarde
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hachage du mot de passe avant la sauvegarde
userSchema.pre('save', async function(next) {
  // Ne hacher le mot de passe que s'il a été modifié
  if (!this.isModified('password')) return next();
  
  // Hacher le mot de passe avec un coût de 12
  this.password = await bcrypt.hash(this.password, 12);
  
  // Supprimer le champ passwordConfirm (il n'est plus nécessaire)
  this.passwordConfirm = undefined;
  
  next();
});

// Mise à jour du champ passwordChangedAt lors du changement de mot de passe
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  // Soustraire 1 seconde pour s'assurer que le token est créé après le changement de mot de passe
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Méthode pour vérifier si le mot de passe a été changé après l'émission du token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  
  // False signifie que le mot de passe n'a PAS été changé
  return false;
};

// Méthode pour créer un token de réinitialisation de mot de passe
userSchema.methods.createPasswordResetToken = function() {
  // Générer un token aléatoire
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hacher le token avant de le stocker en base
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Définir une expiration (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  // Retourner le token non haché (à envoyer par email)
  return resetToken;
};

// Méthode pour créer un token de vérification d'email
userSchema.methods.createEmailVerificationToken = function() {
  // Générer un token aléatoire
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hacher le token avant de le stocker en base
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Définir une expiration (24 heures)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  // Retourner le token non haché (à envoyer par email)
  return verificationToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;