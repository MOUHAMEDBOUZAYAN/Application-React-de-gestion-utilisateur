// routes/adminRoutes.js
// Routes pour les fonctions administrateur

const express = require('express');
const { 
  getUserStats,
  getUserLogs,
  getUserChangeHistory,
  getRecentChanges
} = require('../controllers/adminController');

const { protect, authorize } = require('../middlewares/jwtAuth');
const userLogger = require('../middlewares/userLogger');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);
// Toutes les routes nécessitent le rôle admin
router.use(authorize('admin'));
// Logger les actions admin
router.use(userLogger('admin_action'));

router.get('/stats', getUserStats);
router.get('/logs', getUserLogs);
router.get('/users/:userId/history', getUserChangeHistory);
router.get('/recent-changes', getRecentChanges);

module.exports = router;