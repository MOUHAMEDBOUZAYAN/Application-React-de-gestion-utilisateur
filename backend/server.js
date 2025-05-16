// server.js (version minimale fonctionnelle)
// Point d'entrée principal de l'application

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');

// Charger les variables d'environnement
dotenv.config();

// Importer les composants nécessaires
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const customSecurity = require('./middlewares/customSecurity');
const checkEnv = require('./config/env');

// Vérifier les variables d'environnement
if (typeof checkEnv === 'function') {
  checkEnv();
}

// Connecter à la base de données
connectDB();

// Initialiser l'application Express
const app = express();

// Log des requêtes en mode développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Configuration CORS simplifiée
app.use(cors({
  origin: '*',  // En développement, accepte toutes les origines
  credentials: true
}));

// Parser du body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Configuration des sessions - uniquement si activé
const useSession = process.env.USE_SESSION === 'true';
if (useSession) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secret-key-for-development',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_EXPIRE) || 86400000 // 24 heures par défaut
      }
    })
  );
  console.log('Sessions activées');
} else {
  console.log('Sessions désactivées');
}

// Utiliser le middleware de sécurité personnalisé
app.use(customSecurity);

// Route de base pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API d\'authentification',
    status: 'success',
    time: new Date().toISOString() 
  });
});

// Routes API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Route de gestion des erreurs 404 (route non trouvée)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route non trouvée: ${req.originalUrl}`
  });
});

// Middleware de gestion des erreurs - doit être placé après les routes
app.use(errorHandler);

// Port d'écoute
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${PORT}`);
  console.log(`📄 Documentation API disponible sur http://localhost:${PORT}/\n`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.log('\n❌ Erreur non gérée:', err.message);
  console.log('🔍 Stack trace:', err.stack);
  // Fermer le serveur et quitter le processus
  server.close(() => process.exit(1));
});