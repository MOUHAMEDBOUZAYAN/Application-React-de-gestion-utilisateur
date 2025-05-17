// routes/logRoutes.js
// Routes pour la gestion des logs (admin seulement)

const express = require('express');
const { 
  getLogs,
  getLogStats
} = require('../controllers/logController');

const { protect, authorize } = require('../middlewares/jwtAuth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);
// Toutes les routes nécessitent le rôle admin
router.use(authorize('admin'));

router.get('/', getLogs);
router.get('/stats', getLogStats);

module.exports = router;