// config/cors.js
// Configuration CORS pour l'API

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true,
  exposedHeaders: ['X-Total-Count', 'Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 heures
};

module.exports = corsOptions;