import React, { useState } from 'react';
import axios from 'axios';

export default function VerifyPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);

  const resendEmail = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/auth/resend-verification-email');
      setMessage('Email de vérification renvoyé !');
    } catch (e) {
      setMessage("Erreur lors de l'envoi de l'email.");
    }
    setLoading(false);
  };

  const resendSMS = async () => {
    setSmsLoading(true);
    setSmsMessage('');
    try {
      const res = await axios.post('/api/auth/resendverificationsms');
      setSmsMessage('SMS de vérification envoyé !');
    } catch (e) {
      setSmsMessage("Erreur lors de l'envoi du SMS.");
    }
    setSmsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold mb-4">Vérification requise</h2>
      <p>Veuillez vérifier votre email <b>ou</b> votre numéro de téléphone pour accéder à votre compte.</p>
      <div className="flex flex-col gap-4 mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={resendEmail}
          disabled={loading}
        >
          Renvoyer l'email de vérification
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={resendSMS}
          disabled={smsLoading}
        >
          Renvoyer le SMS de vérification
        </button>
      </div>
      {message && <div className="mt-2 text-green-600">{message}</div>}
      {smsMessage && <div className="mt-2 text-green-600">{smsMessage}</div>}
    </div>
  );
} 