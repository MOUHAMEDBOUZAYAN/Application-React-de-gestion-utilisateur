// utils/sendEmail.js
// Utilitaire pour envoyer des emails avec Nodemailer

const nodemailer = require('nodemailer');

/**
 * Envoyer un email
 * @param {Object} options - Options d'email (email, subject, message, html)
 * @returns {Promise} - Promesse résolue lorsque l'email est envoyé
 */
const sendEmail = async (options) => {
  try {
    // Vérifier si les variables d'environnement SMTP sont définies
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ Configuration SMTP incomplète. Simulation du mode d\'envoi d\'emails.');
      
      // Mode simulation pour le développement
      if (process.env.NODE_ENV === 'development') {
        console.log('\n===== SIMULATION D\'ENVOI EMAIL =====');
        console.log(`À: ${options.email}`);
        console.log(`Sujet: ${options.subject}`);
        console.log(`Message: ${options.message?.substring(0, 100)}...`);
        console.log('HTML: Contenu HTML présent:', !!options.html);
        console.log('===================================\n');
        
        return {
          simulated: true,
          messageId: `sim-${Date.now()}`,
          to: options.email
        };
      }
    }

    // Créer un transporteur SMTP réutilisable
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || 2525),
      secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour d'autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      // Activer le debuggage en développement
      debug: process.env.NODE_ENV === 'development',
      // Augmenter le délai d'attente
      connectionTimeout: 10000, // 10 secondes
      greetingTimeout: 10000  // 10 secondes
    });

    // Options de l'email
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject
    };

    // Ajouter le texte s'il est fourni
    if (options.message) {
      mailOptions.text = options.message;
    }
    
    // Ajouter le HTML s'il est fourni
    if (options.html) {
      mailOptions.html = options.html;
    }

    // Ajouter les pièces jointes si elles existent
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email envoyé avec succès à ${options.email}, ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    // Mode simulation pour le développement en cas d'erreur
    if (process.env.NODE_ENV === 'development') {
      console.log('\n===== SIMULATION D\'ENVOI EMAIL (après erreur) =====');
      console.log(`À: ${options.email}`);
      console.log(`Sujet: ${options.subject}`);
      console.log(`Message: ${options.message?.substring(0, 100)}...`);
      console.log(`Erreur: ${error.message}`);
      console.log('===============================================\n');
      
      return {
        simulated: true,
        messageId: `sim-err-${Date.now()}`,
        to: options.email,
        error: error.message
      };
    }
    
    // En production, propager l'erreur pour qu'elle soit gérée par le contrôleur
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
};



module.exports = sendEmail;