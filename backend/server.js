require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Configuration Email avec timeout augmenté
const emailPassword = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPassword
  },
  connectionTimeout: 30000, // 30 secondes
  greetingTimeout: 30000
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  console.log('✅ Route /api/test appelée');
  res.json({ 
    success: true, 
    message: 'Backend connecté',
    timestamp: new Date().toISOString()
  });
});

// Route d'envoi de notifications
app.post('/api/notifications/send', async (req, res) => {
  const { clientName, clientPhone, clientEmail, type, customMessage } = req.body;

  console.log('=== RÉCEPTION NOTIFICATION ===');
  console.log('Client:', clientName);
  console.log('Téléphone:', clientPhone);
  console.log('Email:', clientEmail);
  console.log('Type:', type);

  let smsResult = { success: false, error: null };
  let emailResult = { success: false, error: null };

  // Messages prédéfinis
  const messages = {
    enroute: `🚛 JM Pominville - Notre équipe est en route vers votre secteur. Merci de libérer votre entrée!`,
    arrived: `📍 JM Pominville - Notre équipe est arrivée dans votre secteur et commence le déneigement.`,
    completed: `✅ JM Pominville - Le déneigement de votre entrée est terminé. Merci de votre confiance!`,
    payment_due_reminder: `📅 JM Pominville - Bonjour ${clientName}, votre paiement pour les services de déneigement était dû hier. Si nous ne recevons pas votre paiement dans les prochains jours, nous devrons procéder au retrait de vos piquets. Merci de régulariser rapidement ou de communiquer avec nous au 514-444-6324.`,
    late_payment: `⚠️ JM Pominville - Bonjour ${clientName}, votre paiement accuse un retard de plus de 7 jours. Sans régularisation rapide, nous procéderons au retrait de vos piquets et à la résiliation du contrat pour le reste de la période de déneigement. Merci de communiquer avec nous au 514-444-6324 dès que possible.`,
    custom: customMessage || ''
  };

  const message = messages[type] || messages.custom;

  // 1. Envoi SMS (si numéro valide)
  if (clientPhone) {
    try {
      console.log(`Tentative envoi SMS à ${clientPhone}...`);
      
      // Vérification config Twilio
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('Configuration Twilio manquante');
      }

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: clientPhone
      });

      console.log(`✅ SMS envoyé avec succès à ${clientPhone}`);
      smsResult.success = true;

    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error.message);
      smsResult.error = error.message;
    }
  }

  // 2. Envoi Email (si email valide)
  if (clientEmail) {
    try {
      console.log(`Tentative envoi Email à ${clientEmail}...`);

      // Vérification config Email
      if (!process.env.EMAIL_USER || !emailPassword) {
        throw new Error('Configuration Email manquante');
      }

      await transporter.sendMail({
        from: `"JM Pominville" <${process.env.EMAIL_USER}>`,
        to: clientEmail,
        subject: type === 'late_payment' ? 'JM Pominville - Retard de paiement - Action requise' : type === 'payment_due_reminder' ? 'JM Pominville - Rappel de paiement' : 'JM Pominville - Notification de Service',
        text: message,
        html: `
          <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
            <div style="background: white; padding: 20px; border-radius: 10px;">
              <h2 style="color: #1a4d1a;">JM Pominville - Service de Déneigement</h2>
              <p style="font-size: 16px; line-height: 1.5;">${message}</p>
              <hr style="border: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                Ce message a été envoyé automatiquement. Pour toute question, 
                contactez-nous au 514-444-6324.
              </p>
            </div>
          </div>
        `
      });

      console.log(`✅ Email envoyé avec succès à ${clientEmail}`);
      emailResult.success = true;

    } catch (error) {
      console.error('❌ Erreur envoi Email:', error.message);
      emailResult.error = error.message;
    }
  }

  // Réponse finale
  const overallSuccess = smsResult.success || emailResult.success;

  res.json({
    success: overallSuccess,
    sms: smsResult,
    email: emailResult,
    message: overallSuccess ? 
      'Au moins une notification envoyée' : 
      'Échec d\'envoi des notifications'
  });
});

// Démarrage serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 BACKEND JM POMINVILLE DÉMARRÉ    ║
╚════════════════════════════════════════╝

✅ Serveur: http://localhost:${PORT}
✅ Route test: /api/test
✅ Notifications: /api/notifications/send

📋 Configuration:
   - Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}
   - Email: ${process.env.EMAIL_USER && emailPassword ? '✅' : '❌'}

En attente de requêtes...
  `);
});
