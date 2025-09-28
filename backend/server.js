const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration CORS
app.use(cors({
  origin: ['https://jm-pominville.onrender.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes API
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend connecté!',
    timestamp: new Date().toISOString()
  });
});
app.get('/', (req, res) => {
  res.json({ 
    message: 'JM Pominville Backend API',
    status: 'active',
    endpoints: ['/api/test', '/api/sync', '/api/notifications/send']
  });
});app.post('/api/sync', (req, res) => {
  res.json({ success: true, message: 'Données synchronisées' });
});

app.post('/api/notifications/send', async (req, res) => {
    console.log('Notification request:', req.body);
    const smsResult = await sendRealSMS(req.body);
    const emailResult = await sendRealEmail(req.body);
    res.json({
        success: true,
        message: 'Notification envoyée',
        results: {
            sms: { success: smsResult,
            email: emailResult }
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
// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});

module.exports = app;
