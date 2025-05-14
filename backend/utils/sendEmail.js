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
  // Créer un transporteur selon l'environnement
  let transporter;
  
  if (process.env.NODE_ENV === 'production') {
    // Configuration pour un service SMTP réel en production
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // En développement, utiliser Ethereal pour les tests
    // Créer un compte de test
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('Compte de test Ethereal créé:', testAccount.user);
  }

  // Définir les options de l'email
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Ajouter le HTML si fourni
  if (options.html) {
    mailOptions.html = options.html;
  }

  // Envoyer l'email
  const info = await transporter.sendMail(mailOptions);

  // Afficher l'URL de prévisualisation en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

module.exports = sendEmail;