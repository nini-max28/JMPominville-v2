const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration Twilio (SMS)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Configuration Nodemailer (Email)
const emailTransporter = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  : null;
console.log('Debug Environment Variables:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'EXISTS' : 'MISSING');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'EXISTS' : 'MISSING');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'EXISTS' : 'MISSING');
// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'JM Pominville Backend - Serveur actif',
    services: {
      sms: !!twilioClient,
      email: !!emailTransporter
    },
    timestamp: new Date().toISOString()
  });
});

// Route de test
app.get('/api/test', (req, res) => {
  console.log('Route /api/test appelée');
  res.json({ 
    success: true, 
    message: 'Backend connecté!',
    services: {
      sms_configured: !!twilioClient,
      email_configured: !!emailTransporter
    },
    timestamp: new Date().toISOString()
  });
});

// Fonction pour envoyer un SMS réel
async function sendRealSMS(phone, message) {
  if (!twilioClient) {
    return { success: false, error: 'Service SMS non configuré' };
  }

  try {
    // Formatage du numéro canadien
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    } else {
      return { success: false, error: 'Format de téléphone invalide' };
    }

    console.log(`Envoi SMS à ${formattedPhone}`);
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`SMS envoyé avec succès, SID: ${result.sid}`);
    return { success: true, messageId: result.sid };

  } catch (error) {
    console.error('Erreur envoi SMS:', error.message);
    return { success: false, error: error.message };
  }
}

// Fonction pour envoyer un email réel
async function sendRealEmail(email, subject, message) {
  if (!emailTransporter) {
    return { success: false, error: 'Service email non configuré' };
  }

  try {
    console.log(`Envoi email à ${email}`);

    const mailOptions = {
      from: {
        name: 'JM Pominville',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a4d1a; margin-bottom: 5px;">JM Pominville</h1>
            <p style="color: #666; margin: 0;">Service de Déneigement Professionnel</p>
            <hr style="border: none; height: 2px; background: #1a4d1a; margin: 20px 0;">
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1a4d1a;">
            <div style="white-space: pre-line; line-height: 1.6; color: #333;">
              ${message}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              <strong>JM Pominville</strong><br>
              Service de Déneigement<br>
              Téléphone: 514-444-6324<br>
              Mirabel, Québec
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`Email envoyé avec succès, ID: ${result.messageId}`);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Erreur envoi email:', error.message);
    return { success: false, error: error.message };
  }
}

// Route notifications avec services réels
app.post('/api/notifications/send', async (req, res) => {
  const { clientName, clientPhone, clientEmail, type, customMessage } = req.body;

  console.log('=== NOTIFICATION REQUEST ===');
  console.log(`Client: ${clientName}`);
  console.log(`Téléphone: ${clientPhone}`);
  console.log(`Email: ${clientEmail}`);
  console.log(`Type: ${type}`);

  // Messages prédéfinis
  const messages = {
    enroute: `🚛 JM Pominville - Équipe en Route

Bonjour ${clientName},

Notre équipe de déneigement est maintenant en route vers votre propriété.

Nous vous contacterons à notre arrivée si nécessaire.

Merci de votre patience!

- Équipe JM Pominville
📞 514-444-6324`,

    arrived: `📍 JM Pominville - Équipe Arrivée

Bonjour ${clientName},

Notre équipe est arrivée et commence maintenant le déneigement de votre propriété.

Le service sera complété dans les plus brefs délais.

Merci!

- Équipe JM Pominville
📞 514-444-6324`,

    completed: `✅ JM Pominville - Service Terminé

Bonjour ${clientName},

Le déneigement de votre propriété est maintenant terminé.

Votre entrée et vos espaces de stationnement sont dégagés.

Merci de votre confiance!

- Équipe JM Pominville
📞 514-444-6324`,

    custom: customMessage || 'Message de JM Pominville'
  };

  const message = messages[type] || messages.custom;
  const emailSubjects = {
    enroute: 'JM Pominville - Équipe en Route',
    arrived: 'JM Pominville - Équipe Arrivée',
    completed: 'JM Pominville - Service Terminé',
    custom: 'JM Pominville - Notification'
  };
  const emailSubject = emailSubjects[type] || emailSubjects.custom;

  const results = { sms: null, email: null };

  // Envoi SMS si numéro de téléphone fourni
  if (clientPhone && clientPhone.trim()) {
    console.log('Tentative envoi SMS...');
    results.sms = await sendRealSMS(clientPhone, message);
  } else {
    results.sms = { success: false, error: 'Aucun numéro de téléphone fourni' };
  }

  // Envoi Email si adresse email fournie
  if (clientEmail && clientEmail.trim()) {
    console.log('Tentative envoi Email...');
    results.email = await sendRealEmail(clientEmail, emailSubject, message);
  } else {
    results.email = { success: false, error: 'Aucune adresse email fournie' };
  }

  console.log('=== RÉSULTATS ===');
  console.log('SMS:', results.sms);
  console.log('Email:', results.email);

  const hasSuccess = results.sms?.success || results.email?.success;

  res.json({
    success: hasSuccess,
    message: hasSuccess ? 'Au moins une notification envoyée' : 'Aucune notification envoyée',
    results: results,
    timestamp: new Date().toISOString()
  });
});

// Route sync
app.post('/api/sync', (req, res) => {
  console.log('Données synchronisées');
  res.json({ 
    success: true, 
    message: 'Données synchronisées avec succès' 
  });
});

// Route location share
app.post('/api/location/share', (req, res) => {
  const token = 'track-' + Date.now();
  const trackingUrl = `https://backend-k97v.onrender.com/track/${token}`;
  
  res.json({
    success: true,
    token: token,
    trackingUrl: trackingUrl,
    message: 'Page de suivi créée avec succès'
  });
});

// Page de suivi
app.get('/track/:token', (req, res) => {
  const { token } = req.params;
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Suivi JM Pominville</title>
      <meta http-equiv="refresh" content="60">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #1a4d1a 0%, #2d5a27 100%);
          color: white;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; }
        .status { 
          background: rgba(255,255,255,0.2);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .token { 
          font-family: monospace;
          background: rgba(0,0,0,0.3);
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚛 JM Pominville</h1>
        <h2>Suivi en Temps Réel</h2>
        
        <div class="status">
          <h3>Statut du Service</h3>
          <p>⏳ En cours de développement</p>
          <p>L'équipe vous contactera directement pour les mises à jour.</p>
        </div>
        
        <div class="token">
          ID de suivi: ${token}
        </div>
        
        <p>📞 Contact: 514-444-6324</p>
        <p><small>Page mise à jour automatiquement</small></p>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== JM POMINVILLE BACKEND ===`);
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`URL: https://backend-1-ohz7.onrender.com`);
  console.log(`Test: https://backend-1-ohz7.onrender.com/api/test`);
  console.log(`Services configurés:`);
  console.log(`  - SMS (Twilio): ${twilioClient ? 'OUI' : 'NON'}`);
  console.log(`  - Email (Gmail): ${emailTransporter ? 'OUI' : 'NON'}`);
  console.log(`=================================`);
});

// Gestion d'erreurs
process.on('uncaughtException', (error) => {
  console.error('Erreur non gérée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejetée:', reason);
});

module.exports = app;
