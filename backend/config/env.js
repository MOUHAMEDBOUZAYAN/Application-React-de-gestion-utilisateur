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
  
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
  
    if (missingEnvVars.length > 0) {
      console.error('Variables d\'environnement manquantes:', missingEnvVars.join(', '));
      process.exit(1);
    }
  
    console.log('Toutes les variables d\'environnement requises sont définies');
  };
  
  module.exports = checkEnv;