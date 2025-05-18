// config/env.js
// Validation des variables d'environnement requises

const checkEnv = () => {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'MONGO_URI',
      'JWT_SECRET',
      'JWT_EXPIRE',
      'SESSION_SECRET',
      'SESSION_EXPIRE',
      'USE_SESSION'
    ];
  
    // Définir des valeurs par défaut pour le développement
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      process.env.NODE_ENV = process.env.NODE_ENV || 'development';
      process.env.PORT = process.env.PORT || '5000';
      process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/404js';
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
      process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
      process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret';
      process.env.SESSION_EXPIRE = process.env.SESSION_EXPIRE || '3600000';
      process.env.USE_SESSION = process.env.USE_SESSION || 'false';
      process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    }
  
    // Vérifier à nouveau après avoir défini les valeurs par défaut
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
  
    if (missingEnvVars.length > 0) {
      console.error('Variables d\'environnement manquantes même après définition des valeurs par défaut:', missingEnvVars.join(', '));
      process.exit(1);
    }
  
    // Modification: Ne pas transformer FRONTEND_URL en tableau
    // L'API cors ne gère pas bien les tableaux, ce qui cause notre erreur
    if (process.env.NODE_ENV === 'development' && process.env.FRONTEND_URL !== 'http://localhost:5173') {
      console.warn('AVERTISSEMENT: Le port frontend est défini sur ' + process.env.FRONTEND_URL);
      console.warn('Votre application frontend semble tourner sur le port 5173.');
      console.warn('Changement de FRONTEND_URL à http://localhost:5173');
      
      // Remplacer par l'URL correcte au lieu d'ajouter à un tableau
      process.env.FRONTEND_URL = 'http://localhost:5173';
    }
  
    console.log('Toutes les variables d\'environnement requises sont définies');
  };
  
  module.exports = checkEnv;