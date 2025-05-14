// config/database.js
// Configuration de la connexion à MongoDB

const mongoose = require('mongoose');

/**
 * Connecter à la base de données MongoDB
 * @returns {Promise} Promise de connexion
 */
const connectDB = async () => {
  try {
    // Note: les options useNewUrlParser et useUnifiedTopology sont dépréciées dans les nouvelles versions
    // mais gardées ici pour la compatibilité avec les versions plus anciennes de MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connecté: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;