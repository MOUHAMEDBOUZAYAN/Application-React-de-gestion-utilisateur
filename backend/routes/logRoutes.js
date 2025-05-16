// routes/logRoutes.js
// Routes pour la gestion des logs utilisateurs

const express = require('express');
const router = express.Router();
const {
  getLogs,
  getLogStats
} = require('../controllers/logController');
const {
  protect,
  authorize
} = require('../middlewares/jwtAuth');

// Protéger toutes les routes et limiter aux administrateurs
router.use(protect);
router.use(authorize('admin'));

// Routes pour les logs
router.get('/', getLogs);
router.get('/stats', getLogStats);

module.exports = router;