// routes/adminRoutes.js - Routes pour les fonctionnalités administrateur

const express = require('express');
const router = express.Router();
const {
  getUserStats,
  getUserLogs,
  getUserChangeHistory,
  getRecentChanges
} = require('../controllers/adminController');
const {
  protect,
  authorize
} = require('../middlewares/jwtAuth');
const logger = require('../middlewares/logger');

// Protéger toutes les routes et limiter aux administrateurs
router.use(protect);
router.use(authorize('admin'));

// Routes statistiques et logs
router.get(
  '/stats', 
  logger('admin_action', 'Consultation des statistiques utilisateurs'),
  getUserStats
);

router.get(
  '/logs', 
  logger('admin_action', 'Consultation des logs utilisateurs'),
  getUserLogs
);

router.get(
  '/users/:userId/history', 
  logger('admin_action', 'Consultation de l\'historique des modifications utilisateur'),
  getUserChangeHistory
);

router.get(
  '/recent-changes', 
  logger('admin_action', 'Consultation des modifications récentes'),
  getRecentChanges
);

module.exports = router;