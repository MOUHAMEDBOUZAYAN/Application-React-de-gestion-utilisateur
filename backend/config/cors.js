// config/cors.js
// Configuration des options CORS pour l'API

module.exports = {
  // Configuration adaptée pour autoriser les requêtes du frontend React
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'], // Autoriser le frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true, // Important pour permettre les cookies entre origines différentes
  exposedHeaders: ['X-Total-Count', 'Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 heures en secondes
};