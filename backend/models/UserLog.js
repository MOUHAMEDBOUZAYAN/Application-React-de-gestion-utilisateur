// models/UserLog.js
// Modèle pour enregistrer les actions des utilisateurs

const mongoose = require('mongoose');

const UserLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Peut être null pour les actions anonymes
    },
    action: {
        type: String,
        required: true,
        enum: [
            'register', 
            'login', 
            'logout', 
            'update_profile', 
            'update_password',
            'reset_password_request',
            'reset_password',
            'verify_email',
            'verify_phone',
            'failed_login',
            'admin_action',
            'other'
        ]
    },
    description: {
        type: String,
        required: true
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    details: {
        type: mongoose.Schema.Types.Mixed // Pour stocker des informations supplémentaires
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Définir des index pour les requêtes fréquentes
UserLogSchema.index({ user: 1 });
UserLogSchema.index({ action: 1 });
UserLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('UserLog', UserLogSchema);