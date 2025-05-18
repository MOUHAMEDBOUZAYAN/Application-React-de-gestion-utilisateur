// config/cors.js
// Configuration des options CORS pour l'API

module.exports = {
  // Configuration adaptée pour autoriser les requêtes du frontend React
  // Le problème vient d'ici - on ne peut pas utiliser un tableau pour 'origin'
  // avec certaines versions de cors, cela cause le problème "multiple values"
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173', // On autorise uniquement l'origine principale de Vite
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true, // Important pour permettre les cookies entre origines différentes
  exposedHeaders: ['X-Total-Count', 'Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 heures en secondes
};