// models/User.js
// Modèle utilisateur

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
    password: {
        type: String,
        required: [true, 'Veuillez fournir un mot de passe'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
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
    }
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