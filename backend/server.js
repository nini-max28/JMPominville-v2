const express = require('express');
const cors = require('cors');
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
// ========== ROUTES API FIRST (TRÈS IMPORTANT) ==========
app.get('/api/test', (req, res) => {
  console.log('Route /api/test appelée');
  res.json({
    success: true,
    message: 'Backend connecté!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/sync', (req, res) => {
  console.log('Données reçues pour sync:', Object.keys(req.body));
  res.json({ success: true, message: 'Données synchronisées'
           });


app.post('/api/notifications/send', async (req, res) => {
  console.log('Notification request:',req.body);
  const smsResult = await sendRealSMS(req.body);    
  const emailResult = await sendRealEmail(req.body);
  res.json({
    success: true,
    message: 'Notification simulée envoyée',
    results: {
      sms: { success: smsResult,
      email: emailResult }
    
  )};

app.post('/api/location/share', (req, res) => {
  const token = 'track-' + Date.now();
  const trackingUrl = `https://backend-k97v.onrender.com/track/${token}`;
  
  res.json({
    success: true,
    token: token,
    trackingUrl: trackingUrl
  });
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
      <p>Suivi activé - Page en développement</p>
    </body>
    </html>
  `);
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' 
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
  console.log(`URL: https://backend-k97v.onrender.com`);
  console.log(`Test: https://backend-k97v.onrender.com/api/test`
});
module.exports = app;
