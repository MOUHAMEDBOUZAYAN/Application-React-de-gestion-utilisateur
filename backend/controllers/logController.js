// controllers/logController.js
// Contrôleur pour la gestion des logs utilisateurs (admin seulement)

const UserLog = require('../models/UserLog');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Obtenir tous les logs
// @route   GET /api/logs
// @access  Private/Admin
exports.getLogs = asyncHandler(async (req, res, next) => {
  // Options de pagination et filtres
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Filtres
  const filterOptions = {};
  
  if (req.query.action) {
    filterOptions.action = req.query.action;
  }
  
  if (req.query.user) {
    filterOptions.user = req.query.user;
  }
  
  if (req.query.startDate && req.query.endDate) {
    filterOptions.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  } else if (req.query.startDate) {
    filterOptions.timestamp = {
      $gte: new Date(req.query.startDate)
    };
  } else if (req.query.endDate) {
    filterOptions.timestamp = {
      $lte: new Date(req.query.endDate)
    };
  }
  
  // Compter les documents total (pour pagination)
  const total = await UserLog.countDocuments(filterOptions);
  
  // Récupérer les logs
  const logs = await UserLog.find(filterOptions)
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .skip(startIndex)
    .limit(limit);
  
  // Pagination
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: logs.length,
    pagination,
    data: logs
  });
});

// @desc    Obtenir les statistiques des logs
// @route   GET /api/logs/stats
// @access  Private/Admin
exports.getLogStats = asyncHandler(async (req, res, next) => {
  // Statistiques par jour (derniers 7 jours)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const dailyStats = await UserLog.aggregate([
    {
      $match: {
        timestamp: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          action: '$action'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1, '_id.action': 1 }
    }
  ]);
  
  // Statistiques globales par action
  const actionStats = await UserLog.aggregate([
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      dailyStats,
      actionStats
    }
  });
});