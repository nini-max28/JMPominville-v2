const express = require('express');
const cors = require('cors');
const twilio = require('twilio'); // Pour SMS
const nodemailer = require('nodemailer'); // Pour Email

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration des services (à ajouter dans les variables d'environnement Render)
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // ou autre service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Configuration CORS
app.use(cors({
  origin: ['https://backend-1-ohz7.onrender.com', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend connecté!',
    timestamp: new Date().toISOString() 
  });
});

// Fonction pour envoyer un vrai SMS
async function sendRealSMS(phone, message) {
  try {
    // Formatage du numéro canadien
    const formattedPhone = phone.startsWith('+1') ? phone : `+1${phone.replace(/\D/g, '')}`;
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Votre numéro Twilio
      to: formattedPhone
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Erreur SMS:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour envoyer un vrai email
async function sendRealEmail(email, subject, message) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a4d1a;">JM Pominville - Service de Déneigement</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Ce message a été envoyé automatiquement par JM Pominville.
          </p>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erreur Email:', error);
    return { success: false, error: error.message };
  }
}

// Route pour notifications - VERSION AVEC VRAIS SERVICES
app.post('/api/notifications/send', async (req, res) => {
  const { clientName, clientPhone, clientEmail, type, customMessage } = req.body;

  // Messages prédéfinis selon le type
  const messages = {
    enroute: `🚛 JM Pominville - Équipe en Route\n\nBonjour ${clientName},\n\nNotre équipe de déneigement est maintenant en route vers votre propriété.\n\nMerci de votre patience!\n- Équipe JM Pominville`,
    arrived: `📍 JM Pominville - Équipe Arrivée\n\nBonjour ${clientName},\n\nNotre équipe est arrivée et commence le déneigement de votre propriété.\n\nMerci!\n- Équipe JM Pominville`,
    completed: `✅ JM Pominville - Service Terminé\n\nBonjour ${clientName},\n\nLe déneigement de votre propriété est maintenant terminé.\n\nMerci de votre confiance!\n- Équipe JM Pominville`,
    custom: customMessage || 'Message de JM Pominville'
  };

  const message = messages[type] || messages.custom;
  const emailSubject = `JM Pominville - ${type === 'enroute' ? 'En Route' : type === 'arrived' ? 'Arrivé' : type === 'completed' ? 'Service Terminé' : 'Notification'}`;

  const results = { sms: null, email: null };

  // Envoi SMS si numéro disponible
  if (clientPhone) {
    results.sms = await sendRealSMS(clientPhone, message);
  }

  // Envoi Email si email disponible
  if (clientEmail) {
    results.email = await sendRealEmail(clientEmail, emailSubject, message);
  }

  res.json({
    success: true,
    message: 'Notifications envoyées',
    results: results
  });
});

// Autres routes existantes...
app.post('/api/sync', (req, res) => {
  console.log('Données reçues pour sync:', Object.keys(req.body));
  res.json({ success: true, message: 'Données synchronisées' });
});

app.post('/api/location/share', (req, res) => {
  const token = 'track-' + Date.now();
  const trackingUrl = `https://backend-k97v.onrender.com/track/${token}`;
  
  res.json({
    success: true,
    token: token,
    trackingUrl: trackingUrl
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📍 URL: https://backend-k97v.onrender.com`);
  console.log(`🧪 Test: https://backend-k97v.onrender.com/api/test`);
});

module.exports = app;
