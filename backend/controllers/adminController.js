// controllers/adminController.js - Contrôleur pour les fonctions administrateur

const User = require('../models/User');
const UserLog = require('../models/UserLog');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Obtenir les statistiques des utilisateurs
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getUserStats = asyncHandler(async (req, res, next) => {
  // Utiliser les agrégations MongoDB pour obtenir des statistiques
  const stats = await User.aggregate([
    {
      $facet: {
        // Nombre total d'utilisateurs
        totalUsers: [
          { $count: 'count' }
        ],
        // Répartition par rôle
        roleDistribution: [
          { 
            $group: { 
              _id: '$role', 
              count: { $sum: 1 } 
            } 
          }
        ],
        // Utilisateurs avec email vérifié
        emailVerified: [
          { 
            $match: { isEmailVerified: true } 
          },
          { $count: 'count' }
        ],
        // Utilisateurs avec téléphone vérifié
        phoneVerified: [
          { 
            $match: { isPhoneVerified: true } 
          },
          { $count: 'count' }
        ],
        // Comptes verrouillés
        lockedAccounts: [
          { 
            $match: { accountLocked: true } 
          },
          { $count: 'count' }
        ],
        // Utilisateurs récemment inscrits (30 derniers jours)
        recentRegistrations: [
          { 
            $match: { 
              createdAt: { 
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
              } 
            } 
          },
          { $count: 'count' }
        ]
      }
    }
  ]);

  // Formater les résultats
  const formattedStats = {
    totalUsers: stats[0].totalUsers[0]?.count || 0,
    roleDistribution: stats[0].roleDistribution || [],
    emailVerified: stats[0].emailVerified[0]?.count || 0,
    phoneVerified: stats[0].phoneVerified[0]?.count || 0,
    lockedAccounts: stats[0].lockedAccounts[0]?.count || 0,
    recentRegistrations: stats[0].recentRegistrations[0]?.count || 0
  };

  res.status(200).json({
    success: true,
    data: formattedStats
  });
});

// @desc    Obtenir l'historique des actions utilisateurs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getUserLogs = asyncHandler(async (req, res, next) => {
  // Options de pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Options de filtrage
  const filter = {};
  
  // Filtrer par utilisateur
  if (req.query.userId) {
    filter.user = req.query.userId;
  }
  
  // Filtrer par type d'action
  if (req.query.action) {
    filter.action = req.query.action;
  }
  
  // Filtrer par date
  if (req.query.startDate && req.query.endDate) {
    filter.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  } else if (req.query.startDate) {
    filter.timestamp = { $gte: new Date(req.query.startDate) };
  } else if (req.query.endDate) {
    filter.timestamp = { $lte: new Date(req.query.endDate) };
  }

  // Récupérer le nombre total de logs
  const total = await UserLog.countDocuments(filter);

  // Récupérer les logs
  const logs = await UserLog.find(filter)
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

// @desc    Obtenir l'historique des changements pour un utilisateur
// @route   GET /api/admin/users/:userId/history
// @access  Private/Admin
exports.getUserChangeHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new ErrorResponse(`Utilisateur non trouvé avec l'ID ${req.params.userId}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user.changeHistory || []
  });
});

// @desc    Obtenir les utilisateurs récemment modifiés
// @route   GET /api/admin/recent-changes
// @access  Private/Admin
exports.getRecentChanges = asyncHandler(async (req, res, next) => {
  // Rechercher les utilisateurs ayant des modifications récentes
  const users = await User.aggregate([
    // Filtrer les utilisateurs avec un historique de modifications
    { $match: { 'changeHistory.0': { $exists: true } } },
    // Trier par la date de modification la plus récente
    { $sort: { 'changeHistory.changedAt': -1 } },
    // Limiter les résultats
    { $limit: 20 },
    // Projeter les champs nécessaires
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        recentChanges: {
          $slice: ['$changeHistory', 5] // Prendre les 5 derniers changements
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});