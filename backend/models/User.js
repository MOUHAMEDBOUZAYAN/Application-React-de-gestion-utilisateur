// models/User.js
// Modèle utilisateur amélioré avec vérification et historique

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Sous-schéma pour l'historique des modifications
const changeHistorySchema = new mongoose.Schema({
    fieldName: {
        type: String,
        required: true,
        enum: ['email', 'name', 'phone'] // Champs dont on veut suivre les changements
    },
    oldValue: {
        type: String,
        required: true
    },
    newValue: {
        type: String,
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    }
});

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Veuillez fournir un nom'],
        trim: true,
        maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },
    email: {
        type: String,
        required: [true, 'Veuillez fournir un email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Veuillez fournir un email valide'
        ],
        lowercase: true
    },
    phone: {
        type: String,
        match: [
            /^\+?[0-9]{10,15}$/,
            'Veuillez fournir un numéro de téléphone valide'
        ],
        sparse: true // Permet des valeurs null tout en maintenant l'unicité si défini
    },
    password: {
        type: String,
        required: [true, 'Veuillez fournir un mot de passe'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false // Ne pas inclure par défaut dans les requêtes
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Champs pour la vérification d'email
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    
    // Champs pour la vérification de téléphone
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    phoneVerificationCode: String,
    phoneVerificationExpire: Date,
    
    // Champs pour la réinitialisation de mot de passe
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // Champs pour la gestion de la sécurité
    lastLogin: Date,
    accountLocked: {
        type: Boolean,
        default: false
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Historique des modifications
    changeHistory: [changeHistorySchema]
});

// Chiffrer le mot de passe avant l'enregistrement
UserSchema.pre('save', async function (next) {
    // Ne pas rehacher le mot de passe s'il n'a pas été modifié
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

// Méthode pour vérifier si le mot de passe correspond
UserSchema.methods.matchPassword = async function (enteredPassword) {
    if (!enteredPassword) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Méthode pour générer et signer un token JWT
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET || 'secret-dev-jwt',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Générer et hacher un token de réinitialisation de mot de passe
UserSchema.methods.getResetPasswordToken = function () {
    // Générer un token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hacher le token et le stocker dans le document
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Définir la date d'expiration (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Générer un token pour vérification d'email
UserSchema.methods.getEmailVerificationToken = function () {
    // Générer un token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Hacher le token et le stocker dans le document
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    // Définir la date d'expiration (24 heures)
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

    return verificationToken;
};

// Générer un code de vérification pour téléphone
UserSchema.methods.getPhoneVerificationCode = function () {
    // Générer un code de 6 chiffres
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Stocker le code et sa date d'expiration
    this.phoneVerificationCode = verificationCode;
    this.phoneVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return verificationCode;
};

// Méthode pour suivre l'historique des modifications
UserSchema.methods.trackChange = function (fieldName, oldValue, newValue) {
    if (!oldValue) oldValue = ''; // Gérer le cas où l'ancienne valeur est null
    if (!newValue) newValue = ''; // Gérer le cas où la nouvelle valeur est null
    
    this.changeHistory.push({
        fieldName,
        oldValue,
        newValue,
        changedAt: Date.now()
    });
};

// Méthode pour incrémenter les tentatives de connexion
UserSchema.methods.incrementLoginAttempts = async function () {
    this.loginAttempts += 1;

    // Verrouiller le compte après 5 tentatives échouées
    if (this.loginAttempts >= 5) {
        this.accountLocked = true;
    }

    await this.save();
};

// Méthode pour réinitialiser les tentatives de connexion
UserSchema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.accountLocked = false;
    this.lastLogin = Date.now();

    await this.save();
};

module.exports = mongoose.model('User', UserSchema);