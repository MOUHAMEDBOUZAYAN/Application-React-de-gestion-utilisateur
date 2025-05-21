// config/env.js
// Vérification des variables d'environnement requises

const checkEnv = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'MONGO_URI',
    'FRONTEND_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error('Variables d\'environnement manquantes:'.red);
    missingEnvVars.forEach(envVar => console.error(`- ${envVar}`.red));
    process.exit(1);
  }

  console.log('Toutes les variables d\'environnement requises sont définies');
};

module.exports = checkEnv;