// controllers/userController.js
// Contrôleurs pour la gestion des utilisateurs (admin seulement)

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  // Options de pagination et filtres
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Filtres
  const filterOptions = {};
  
  if (req.query.role) {
    filterOptions.role = req.query.role;
  }
  
  if (req.query.locked === 'true') {
    filterOptions.accountLocked = true;
  } else if (req.query.locked === 'false') {
    filterOptions.accountLocked = false;
  }
  
  // Recherche de texte
  if (req.query.search) {
    filterOptions.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Compter les documents total (pour pagination)
  const total = await User.countDocuments(filterOptions);
  
  // Récupérer les utilisateurs
  const users = await User.find(filterOptions)
    .select('-password')
    .sort({ createdAt: -1 })
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
    count: users.length,
    pagination,
    data: users
  });
});

// @desc    Obtenir un utilisateur spécifique
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return next(new ErrorResponse(`Utilisateur non trouvé avec l'ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Créer un utilisateur
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  // Vérifier si l'email existe déjà
  const emailExists = await User.findOne({ email: req.body.email });
  
  if (emailExists) {
    return next(new ErrorResponse('Un utilisateur avec cet email existe déjà', 400));
  }
  
  // Créer l'utilisateur
  const user = await User.create(req.body);
  
  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Supprimer les champs sensibles s'ils existent
  const updateData = { ...req.body };
  delete updateData.loginAttempts;
  
  // Si la mise à jour contient un mot de passe, le traiter séparément
  let user;
  if (updateData.password) {
    // Récupérer l'utilisateur pour utiliser le middleware de hachage du mot de passe
    user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse(`Utilisateur non trouvé avec l'ID ${req.params.id}`, 404));
    }
    
    // Mettre à jour le mot de passe
    user.password = updateData.password;
    delete updateData.password;
    
    // Mettre à jour les autres champs
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });
    
    await user.save();
  } else {
    // Mise à jour sans mot de passe
    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      return next(new ErrorResponse(`Utilisateur non trouvé avec l'ID ${req.params.id}`, 404));
    }
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Empêcher la suppression du propre compte admin
  if (req.params.id === req.user.id) {
    return next(new ErrorResponse(`Vous ne pouvez pas supprimer votre propre compte`, 400));
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse(`Utilisateur non trouvé avec l'ID ${req.params.id}`, 404));
  }
  
  await user.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

