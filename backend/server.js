// server.js - Fichier principal d'entrée de l'application

// Modules
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Configuration des variables d'environnement
dotenv.config({ path: './config/.env' });

// Importer les middlewares de sécurité personnalisés
const customSecurity = require('./middlewares/customSecurity');
const errorHandler = require('./middlewares/errorHandler');

// Importer la configuration de la base de données
const connectDB = require('./config/database');
const checkEnv = require('./config/env');

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Vérifier les variables d'environnement requises
checkEnv();

// Connexion à la base de données
connectDB();

// Initialisation de l'application Express
const app = express();

// Body parser - Pour analyser les corps des requêtes JSON
app.use(express.json({ limit: '10kb' }));

// Cookie parser - Pour analyser les cookies
app.use(cookieParser());

// Middleware de journalisation en développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Charger les options CORS une seule fois pour éviter les doubles applications
const corsOptions = require('./config/cors');
console.log('Configuration CORS:', corsOptions);

// Middleware de sécurité - CORS (appliqué une seule fois)
app.use(cors(corsOptions));

// Sessions - si activées
if (process.env.USE_SESSION === 'true') {
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_EXPIRE || 60) * 60 * 1000 // en minutes
      }
    })
  );
}

// Middleware de sécurité personnalisé (MongoDB sanitize + XSS)
app.use(customSecurity);

// Middleware de sécurité - Helmet pour les en-têtes HTTP
app.use(helmet());

// Middleware de sécurité - Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer après 15 minutes'
});
app.use('/api/auth', limiter); // Appliquer aux routes d'authentification

// Middleware de sécurité - Prévention de la pollution des paramètres HTTP
app.use(hpp());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);

// Route de base pour tester l'API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API 404.js',
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Middleware pour les routes non trouvées
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.originalUrl}`
  });
});

// Port pour le serveur
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution en mode ${process.env.NODE_ENV} sur le port ${PORT}`.yellow.bold);
});

// Gestion des rejets de promesses non gérées
process.on('unhandledRejection', (err, promise) => {
  console.error(`Erreur: ${err.message}`.red);
  console.error(err.stack);
  // Fermer le serveur et quitter le processus
  server.close(() => process.exit(1));
});

module.exports = server;