// server.js
// Point d'entrée principal de l'application

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: './.env' });

// Vérifier les variables d'environnement requises
const checkEnv = require('./config/env');
checkEnv();

// Connexion à la base de données
const connectDB = require('./config/database');
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middlewares personnalisés
const errorHandler = require('./middlewares/errorHandler');
const customSecurity = require('./middlewares/customSecurity');

// Initialiser l'app Express
const app = express();

// Middleware pour analyser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware pour analyser les cookies
app.use(cookieParser());

// Configuration de la session (si activée)
const useSession = process.env.USE_SESSION === 'true';
if (useSession) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_EXPIRE) || 60 * 60 * 1000 // 1 heure par défaut
      }
    })
  );
}

// Logging en développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sécurité
app.use(helmet()); // En-têtes de sécurité HTTP
app.use(customSecurity); // Protection contre l'injection MongoDB et XSS

// Configuration CORS
app.use(cors(require('./config/cors')));

// Limiter les requêtes API
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes de cette adresse IP, veuillez réessayer après 10 minutes'
});
app.use('/api', limiter);

// Définir les routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);

// Page d'accueil simple
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API 404.js. Consultez la documentation pour plus d\'informations.'
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${PORT}`);
});

// Gérer les rejets de promesses non gérées
process.on('unhandledRejection', (err, promise) => {
  console.error(`Erreur: ${err.message}`);
  // Fermer le serveur et sortir du processus
  server.close(() => process.exit(1));
});

module.exports = app; // Pour les tests