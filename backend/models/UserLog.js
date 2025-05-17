// models/UserLog.js
// Modèle pour la journalisation des actions utilisateurs

const mongoose = require('mongoose');

const UserLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Permettre des logs pour des actions sans utilisateur authentifié
    required: false
  },
  action: {
    type: String,
    required: [true, 'Type d\'action requis'],
    enum: [
      'login', 
      'logout', 
      'login_failed',
      'register', 
      'reset_password', 
      'update_profile',
      'verify_email',
      'verify_phone',
      'resend_verification_email',
      'resend_verification_sms',
      'account_locked',
      'account_unlocked',
      'admin_login',
      'admin_action',
      'delete_account',
      'other'
    ]
  },
  description: {
    type: String,
    required: false
  },
  ip: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', ''],
    required: false
  },
  route: {
    type: String,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  status: {
    type: Number,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexer pour des recherches rapides
UserLogSchema.index({ user: 1, timestamp: -1 });
UserLogSchema.index({ action: 1, timestamp: -1 });
UserLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('UserLog', UserLogSchema);