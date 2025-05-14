// config/cors.js
// Configuration des options CORS pour l'API

module.exports = {
  // Accepter toutes les origines en mode développement
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true,
  exposedHeaders: ['X-Total-Count', 'Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 heures en secondes
};