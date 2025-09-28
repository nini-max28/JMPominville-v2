const express = require('express');
const cors = require('cors');
const twilio = rquire('twilio');
const nodemailer = rquire('nodemailer');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 10000;

// Configuration CORS 
app.use(cors({
  origin: ['https://jmpominville-v2.onrender.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
app.get('/', (req, res) => {
    res.json({
        message: 'Backend JM Pominville API',
        status: 'Active',
        endpoints: [
            '/api/test',
            '/api/sync', 
            '/api/notifications/send',
            '/track/:token'
        ]
    });
});
async function sendRealSMS(phone, type, customMessage, clientName) {
  // Configuration Twilio ou autre service SMS réel
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !fromPhone) {
    console.log('Configuration SMS manquante - simulation');
    return { 
      success: true, 
      simulated: true, 
      message: 'SMS simulé (config manquante)' 
    };
  }
  
  // Code Twilio réel ici
  const twilio = require('twilio')(accountSid, authToken);
  
  const message = customMessage || getDefaultMessage(type, clientName);
  
  try {
    const result = await twilio.messages.create({
      body: message,
      from: fromPhone,
      to: phone
    });
    
    return { 
      success: true, 
      messageId: result.sid,
      simulated: false 
    };
  } catch (error) {
    throw new Error(`Twilio SMS Error: ${error.message}`);
  }
}
async function sendRealEmail(email, type, customMessage, clientName) {
  // Configuration Email
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Configuration Email manquante - simulation');
    return { 
      success: true, 
      simulated: true, 
      message: 'Email simulé (config Email manquante)' 
    };
  }
  
  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const subject = getEmailSubject(type);
    const message = customMessage || getDefaultMessage(type, clientName);
    
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
               <h2 style="color: #1a4d1a;">JM Pominville - Service de Déneigement</h2>
               <p>${message.replace(/\n/g, '<br>')}</p>
               <hr>
               <small style="color: #666;">Équipe JM Pominville | 514-444-6324</small>
             </div>`
    });
    
    console.log(`Email envoyé à ${email}: ${result.messageId}`);
    return { 
      success: true, 
      messageId: result.messageId,
      simulated: false 
    };
  } catch (error) {
    console.error('Erreur Email:', error);
    throw new Error(`Erreur Email: ${error.message}`);
  }
}

function getDefaultMessage(type, clientName) {
  switch (type) {
    case 'enroute':
      return `Bonjour ${clientName},\n\nNotre équipe JM Pominville se dirige vers votre propriété pour le service de déneigement.\n\nHeure estimée d'arrivée: dans les prochaines 30 minutes.\n\nMerci de libérer l'accès à votre entrée.\n\nÉquipe JM Pominville\n514-444-6324`;
      
    case 'completion':
      return `Bonjour ${clientName},\n\nLe déneigement de votre propriété est maintenant terminé.\n\nServices effectués:\n- Déneigement de l'entrée\n- Dégagement des accès\n\nMerci de votre confiance!\n\nÉquipe JM Pominville\n514-444-6324`;
      
    case 'reminder':
      return `Bonjour ${clientName},\n\nRappel amical concernant votre paiement pour le service de déneigement saisonnier.\n\nPour toute question, contactez-nous au 514-444-6324.\n\nMerci de votre collaboration.\n\nJM Pominville`;
      
    default:
      return `Notification de l'équipe JM Pominville pour ${clientName}.\n\nPour plus d'informations: 514-444-6324`;
  }
}

function getEmailSubject(type) {
  switch (type) {
    case 'enroute':
      return '🚛 JM Pominville - Équipe en route vers votre propriété';
    case 'completion':
      return '✅ JM Pominville - Déneigement terminé';
    case 'reminder':
      return '💰 JM Pominville - Rappel de paiement';
    default:
      return 'JM Pominville - Notification de service';
  }
}

// ==========================================
// 2. MODIFIEZ VOTRE ROUTE EXISTANTE /api/notifications/send
// ==========================================

app.post('/api/notifications/send', async (req, res) => {
  console.log('Demande notification reçue:', req.body);
  
  const { clientId, clientName, clientPhone, clientEmail, type, customMessage } = req.body;
  
  // Validation
  if (!clientId || !clientName) {
    return res.status(400).json({ 
      success: false, 
      error: 'clientId et clientName sont requis' 
    });
  }
  
  if (!clientPhone && !clientEmail) {
    return res.status(400).json({ 
      success: false, 
      error: 'Au moins un téléphone ou email est requis' 
    });
  }
  
  try {
    const results = {};
    
    // SMS si téléphone fourni
    if (clientPhone) {
      try {
        results.sms = await sendRealSMS(clientPhone, type, customMessage, clientName);
      } catch (smsError) {
        console.error('Échec SMS:', smsError);
        results.sms = { success: false, error: smsError.message };
      }
    }
    
    // Email si adresse fournie
    if (clientEmail) {
      try {
        results.email = await sendRealEmail(clientEmail, type, customMessage, clientName);
      } catch (emailError) {
        console.error('Échec Email:', emailError);
        results.email = { success: false, error: emailError.message };
      }
    }
    
    // LIGNE 57 MODIFIÉE - enlever "simulée"
    res.json({
      success: true,
      message: 'Notification envoyée', // <- PAS "simulée"
      results: results,
      notification: {
        clientName: clientName,
        type: type,
        timestamp: new Date().toISOString(),
        simulated: (results.sms?.simulated || results.email?.simulated) || false
      }
    });
    
  } catch (error) {
    console.error('Erreur serveur notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

// ==========================================
// VOS AUTRES ROUTES EXISTANTES RESTENT ICI
// ==========================================

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend JM Pominville actif' });
});

// Route de synchronisation
app.post('/api/sync', (req, res) => {
  // ... votre code existant
});

// Route de partage de localisation
app.post('/api/location/share', (req, res) => {
  // ... votre code existant
});

// Route de suivi - LIGNE 84 À MODIFIER
app.get('/track/:token', (req, res) => {
  const { token } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Suivi JM Pominville</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <h1>Équipe JM Pominville - Suivi en Temps Réel</h1>
      <p>Token: ${token}</p>
      <p>Suivi actif - Équipe JM Pominville en tournée</p>  <!-- LIGNE 84 MODIFIÉE -->
    </body>
    </html>
  `);
});

// ========== ROUTES API FIRST (TRÈS IMPORTANT) ==========
app.get('/api/test', (req, res) => {
  console.log('Route /api/test appelée');
  res.json({
    success: true,
    message: 'Backend connecté!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/notifications/send', async (req, res) => {
  console.log('Notification request:', req.body);
  
  const { clientId, clientName, clientPhone, clientEmail, type, customMessage } = req.body;
  
  // Validation des données
  if (!clientId || !clientName) {
    return res.status(400).json({ 
      success: false, 
      error: 'clientId et clientName sont requis' 
    });
  }
  
  if (!clientPhone && !clientEmail) {
    return res.status(400).json({ 
      success: false, 
      error: 'Au moins un téléphone ou email est requis' 
    });
  }
  
  try {
    const results = {};
    
    // Envoyer SMS si téléphone fourni
    if (clientPhone) {
      try {
        const smsResult = await sendRealSMS(clientPhone, type, customMessage, clientName);
        results.sms = smsResult;
      } catch (smsError) {
        console.error('Erreur SMS:', smsError);
        results.sms = { success: false, error: smsError.message };
      }
    }
    
    // Envoyer Email si email fourni  
    if (clientEmail) {
      try {
        const emailResult = await sendRealEmail(clientEmail, type, customMessage, clientName);
        results.email = emailResult;
      } catch (emailError) {
        console.error('Erreur Email:', emailError);
        results.email = { success: false, error: emailError.message };
      }
    }
    
    // Réponse sans "simulée"
    res.json({
      success: true,
      message: 'Notification traitée', // <- PAS "simulée"
      results: results,
      notification: {
        clientName: clientName,
        type: type,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erreur serveur notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});
app.post('/api/location/share', (req, res) => {
    const token = 'track-' + Date.now();
    const trackingUrl = `https://backend-k97v.onrender.com/track/${token}`;
    
    res.json({
        success: true,
        token: token,
        trackingUrl: trackingUrl
    });
app.get('/track/:token', (req, res) => {
    const { token } = req.params;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Suivi JM Pominville</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
            <h1>Équipe JM Pominville - Suivi en Temps Réel</h1>
            <p>Token: ${token}</p>
            <p>Suivi actif - Équipe JM Pominville en tournée</p>
        </body>
        </html>
    `);
// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
  console.log(`URL: https://backend-k97v.onrender.com`);
  console.log(`Test: https://backend-k97v.onrender.com/api/test`);
});
module.exports = app;
