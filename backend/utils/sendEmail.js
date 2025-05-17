// utils/sendEmail.js
// Utilitaire pour envoyer des emails avec Nodemailer

const nodemailer = require('nodemailer');

/**
 * Envoyer un email
 * @param {Object} options - Options d'email (email, subject, message, html)
 * @returns {Promise} - Promesse résolue lorsque l'email est envoyé
 */
const sendEmail = async (options) => {
  // Créer un transporteur SMTP réutilisable
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour d'autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Options de l'email
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message || '',
    html: options.html || ''
  };

  // Ajouter les pièces jointes si elles existent
  if (options.attachments) {
    mailOptions.attachments = options.attachments;
  }

  // Envoyer l'email
  const info = await transporter.sendMail(mailOptions);

  console.log(`Email envoyé: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;