// models/User.js
// Modèle pour les utilisateurs avec méthodes de vérification et de sécurité

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom'],
    trim: true,
    minlength: [2, 'Le nom doit comporter au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez ajouter un email'],
    unique: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Veuillez ajouter un email valide'
    ],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Veuillez ajouter un mot de passe'],
    minlength: [8, 'Le mot de passe doit comporter au moins 8 caractères'],
    select: false // Ne pas retourner le mot de passe par défaut
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    match: [/^\+?[0-9]{10,15}$/, 'Veuillez fournir un numéro de téléphone valide'],
    unique: true,
    sparse: true // Permet des valeurs nulles tout en maintenant l'unicité
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  phoneVerificationCode: String,
  phoneVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  accountLocked: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lastLogin: Date,
  lastFailedLogin: Date,
  // Historique des modifications pour l'audit
  changeHistory: [
    {
      field: String, // Champ modifié
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      changedAt: {
        type: Date,
        default: Date.now
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      ip: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Chiffrer le mot de passe avant la sauvegarde
UserSchema.pre('save', async function(next) {
  // Ne pas hacher à nouveau le mot de passe s'il n'a pas été modifié
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Générer un jeton JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Comparer le mot de passe fourni avec le mot de passe haché
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Générer un token de réinitialisation de mot de passe
UserSchema.methods.getResetPasswordToken = function() {
  // Générer un token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hacher le token et le stocker
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Définir l'expiration (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Générer un token de vérification d'email
UserSchema.methods.getEmailVerificationToken = function() {
  // Générer un token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  // Hacher le token et le stocker
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Définir l'expiration (24 heures)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Générer un code de vérification par téléphone (6 chiffres)
UserSchema.methods.getPhoneVerificationCode = function() {
  // Générer un code à 6 chiffres
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Stocker le code
  this.phoneVerificationCode = verificationCode;
  
  // Définir l'expiration (10 minutes)
  this.phoneVerificationExpire = Date.now() + 10 * 60 * 1000;
  
  return verificationCode;
};

// Incrémenter le compteur de tentatives de connexion
UserSchema.methods.incrementLoginAttempts = async function() {
  // Incrémenter le compteur
  this.loginAttempts += 1;
  this.lastFailedLogin = Date.now();
  
  // Verrouiller le compte après 5 tentatives échouées
  if (this.loginAttempts >= 5) {
    this.accountLocked = true;
    console.log(`Compte verrouillé pour ${this.email} après ${this.loginAttempts} tentatives échouées`);
  }
  
  await this.save();
  return this.loginAttempts;
};

// Réinitialiser le compteur de tentatives de connexion
UserSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lastLogin = Date.now();
  await this.save();
};

// Middleware pour suivre les modifications des champs
UserSchema.pre('save', function(next) {
  if (this.isNew) return next();
  
  const modifiedPaths = this.modifiedPaths();
  
  // Exclure les champs sensibles et internes
  const excludedFields = [
    'password', 
    'resetPasswordToken', 
    'resetPasswordExpire',
    'emailVerificationToken',
    'emailVerificationExpire',
    'phoneVerificationCode',
    'phoneVerificationExpire',
    'loginAttempts',
    'lastLogin',
    'lastFailedLogin',
    'changeHistory'
  ];
  
  const changedFields = modifiedPaths.filter(path => 
    !excludedFields.includes(path) && 
    !path.startsWith('_')
  );
  
  if (changedFields.length > 0) {
    const changes = changedFields.map(field => {
      return {
        field,
        oldValue: this._oldObj ? this._oldObj[field] : undefined,
        newValue: this[field],
        changedAt: Date.now(),
        // Ces valeurs doivent être définies par le middleware d'authentification
        changedBy: this._currentUser || null,
        ip: this._currentIp || null
      };
    });
    
    // Ajouter aux changements existants
    this.changeHistory = [...(this.changeHistory || []), ...changes];
  }
  
  next();
});

// Enregistrer l'état original pour pouvoir suivre les modifications
UserSchema.post('init', function(doc) {
  this._oldObj = doc.toObject();
});

module.exports = mongoose.model('User', UserSchema);