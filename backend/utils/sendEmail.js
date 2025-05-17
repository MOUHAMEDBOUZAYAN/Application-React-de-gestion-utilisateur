// utils/sendEmail.js mis à jour pour une meilleure compatibilité avec Mailtrap
// utils/sendEmail.js
// Utilitaire pour envoyer des emails

const nodemailer = require('nodemailer');

/**
 * Envoyer un email
 * @param {Object} options - Options de l'email
 * @param {string} options.email - Adresse email du destinataire
 * @param {string} options.subject - Sujet de l'email
 * @param {string} options.message - Contenu de l'email
 * @returns {Promise} Promesse résolue après l'envoi de l'email
 */
const sendEmail = async (options) => {
  // Configuration du transporteur - en développement, on utilise Mailtrap par défaut
  const transportConfig = {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };
  
  // Créer un transporteur
  const transporter = nodemailer.createTransport(transportConfig);
  
  // En mode développement, on affiche les informations de configuration
  if (process.env.NODE_ENV === 'development') {
    console.log('Configuration email:', {
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
      user: transportConfig.auth.user ? 'DÉFINI' : 'NON DÉFINI',
      pass: transportConfig.auth.pass ? 'DÉFINI' : 'NON DÉFINI'
    });
  }

  // Définir les options de l'email
  const mailOptions = {
    from: `${process.env.FROM_NAME || '404.js Auth'} <${process.env.FROM_EMAIL || 'noreply@404js.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Ajouter le HTML si fourni
  if (options.html) {
    mailOptions.html = options.html;
  }

  try {
    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    
    // En mode développement, afficher l'URL de prévisualisation si disponible (Mailtrap)
    if (process.env.NODE_ENV === 'development') {
      if (transportConfig.host.includes('mailtrap') && info.messageId) {
        console.log('Email envoyé! Vérifiez Mailtrap. ID:', info.messageId);
      } else if (info.messageUrl) {
        console.log('URL de prévisualisation:', info.messageUrl);
      } else {
        console.log('Email envoyé avec succès:', info.response);
      }
    }
    
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    // En mode développement, simuler l'envoi pour pouvoir continuer à tester
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Mode développement: Simulation d\'envoi d\'email');
      console.log('Destinataire:', options.email);
      console.log('Sujet:', options.subject);
      console.log('Message:', options.message);
      
      return {
        simulated: true,
        to: options.email,
        subject: options.subject
      };
    }
    
    throw error;
  }
};

module.exports = sendEmail;