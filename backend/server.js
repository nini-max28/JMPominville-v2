const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['https://jm-pominville.onrender.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configurations
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Fonctions
async function sendRealSMS(data) {
  try {
    const message = await twilioClient.messages.create({
      body: `JM Pominville: ${data.message || 'Notification'}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: data.phone || '+17622460623'
    });
    return { success: true, messageId: message.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendRealEmail(data) {
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.email || 'jmpominvilledeneigement@gmail.com',
      subject: 'JM Pominville - Notification',
      text: data.message || 'Nouvelle notification'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'JM Pominville Backend API', status: 'active' });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend connecté!' });
});

app.post('/api/sync', (req, res) => {
  res.json({ success: true, message: 'Données synchronisées' });
});

app.post('/api/notifications/send', async (req, res) => {
  const smsResult = await sendRealSMS(req.body);
  const emailResult = await sendRealEmail(req.body);
  res.json({
    success: true,
    message: 'Notifications envoyées',
    results: { sms: smsResult, email: emailResult }
  });
});

app.post('/api/location/share', (req, res) => {
  const token = 'track-' + Date.now();
  res.json({
    success: true,
    token: token,
    trackingUrl: `https://backend-k97v.onrender.com/track/${token}`
  });
});

app.listen(PORT, () => {
  console.log(`Backend démarré sur le port ${PORT}`);
});

module.exports = app;
