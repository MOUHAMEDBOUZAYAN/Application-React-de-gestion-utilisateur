// utils/sendSMS.js
// Utilitaire pour envoyer des SMS via Twilio

const twilio = require('twilio');

/**
 * Envoyer un SMS via Twilio
 * @param {Object} options - Options du SMS
 * @param {string} options.to - Numéro de téléphone du destinataire
 * @param {string} options.message - Contenu du SMS
 * @returns {Promise} Promesse résolue après l'envoi du SMS
 */
const sendSMS = async (options) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  // Vérifier si les credentials Twilio sont configurés
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️ Configuration Twilio manquante. Impossible d\'envoyer des SMS réels.');
    
    // En développement, simuler l'envoi du SMS
    if (process.env.NODE_ENV === 'development') {
      console.log('\n===== SIMULATION D\'ENVOI SMS =====');
      console.log(`À: ${options.to}`);
      console.log(`Message: ${options.message}`);
      console.log('===================================\n');
      
      return {
        simulated: true,
        to: options.to,
        body: options.message
      };
    }
    
    throw new Error('Configuration Twilio manquante.');
  }
  
  try {
    // Initialiser le client Twilio
    const client = twilio(accountSid, authToken);
    
    // Envoyer le SMS
    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: options.to
    });
    
    console.log(`SMS envoyé avec succès à ${options.to}, SID: ${message.sid}`);
    
    return message;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    
    // En développement, simuler l'envoi en cas d'erreur
    if (process.env.NODE_ENV === 'development') {
      console.log('\n===== SIMULATION D\'ENVOI SMS (après erreur) =====');
      console.log(`À: ${options.to}`);
      console.log(`Message: ${options.message}`);
      console.log('===============================================\n');
      
      return {
        simulated: true,
        to: options.to,
        body: options.message,
        error: error.message
      };
    }
    
    throw error;
  }
};

module.exports = sendSMS;