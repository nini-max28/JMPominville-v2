require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Dossier de sauvegarde des données. Si tu ajoutes un "Persistent Disk" sur Render,
// pointe DATA_DIR vers son chemin de montage (ex: /data) pour que les données
// survivent aux redéploiements. Sans ça, ce dossier est effacé à chaque déploiement.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'sync-data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'sync-data-backup.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Configuration Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Configuration Brevo (API web pour l'envoi de courriels - évite le blocage SMTP de Render)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EWAIL_USER;
const BREVO_SENDER_NAME = process.env.EMAIL_FROM_NAME || 'JM Pominville';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));

if (!BREVO_SENDER_EMAIL) {
  console.warn('⚠️ ATTENTION: aucune adresse expéditeur trouvée (EMAIL_FROM_ADDRESS / EMAIL_FROM / EMAIL_USER). Les courriels vont échouer tant que ce n\'est pas corrigé.');
} else {
  console.log(`📧 Adresse expéditeur Brevo utilisée: ${BREVO_SENDER_EMAIL}`);
}

// Test route
app.get('/api/test', (req, res) => {
  console.log('✅ Route /api/test appelée');
  res.json({ 
    success: true, 
    message: 'Backend connecté',
    timestamp: new Date().toISOString()
  });
});

// Envoi d'un courriel via l'API web de Brevo (HTTPS, pas de blocage SMTP)
async function sendEmailViaBrevo(toEmail, subject, message) {
  if (!BREVO_API_KEY) {
    throw new Error('Configuration Brevo manquante (BREVO_API_KEY)');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject: subject,
      textContent: message,
      htmlContent: `
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
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Erreur Brevo (HTTP ${response.status})`);
  }

  return data;
}

// Route d'envoi de notifications
app.post('/api/notifications/send', async (req, res) => {
  const {
    clientName,
    clientPhone,
    clientEmail,
    type,
    customMessage,
    sendSms = true,
    sendEmail = true
  } = req.body;

  console.log('=== RÉCEPTION NOTIFICATION ===');
  console.log('Client:', clientName);
  console.log('Téléphone:', clientPhone);
  console.log('Email:', clientEmail);
  console.log('Type:', type);
  console.log('Canaux demandés — SMS:', sendSms, '| Email:', sendEmail);

  let smsResult = { success: false, error: null, skipped: !sendSms };
  let emailResult = { success: false, error: null, skipped: !sendEmail };

  // Messages prédéfinis
  const messages = {
    enroute: `🚛 JM Pominville - Notre équipe est en route vers votre secteur. Merci de libérer votre entrée!`,
    arrived: `📍 JM Pominville - Notre équipe est arrivée dans votre secteur et commence le déneigement.`,
    completed: `✅ JM Pominville - Le déneigement de votre entrée est terminé. Merci de votre confiance!`,
    payment_due_reminder: `📅 JM Pominville - Bonjour ${clientName}, votre paiement pour les services de déneigement était dû hier. Si nous ne recevons pas votre paiement dans les 5 prochains jours, nous devrons procéder au retrait de vos piquets. Merci de régulariser rapidement ou de communiquer avec nous au 514-444-6324.`,
    late_payment: `⚠️ JM Pominville - Bonjour ${clientName}, votre paiement accuse un retard de plus de 7 jours. Sans régularisation rapide, nous procéderons au retrait de vos piquets et à la résiliation du contrat pour le reste de la période de déneigement. Merci de communiquer avec nous au 514-444-6324 dès que possible.`,
    custom: customMessage || ''
  };

  const message = messages[type] || messages.custom;

  // 1. Envoi SMS (si demandé ET numéro valide)
  if (sendSms && clientPhone) {
    try {
      console.log(`Tentative envoi SMS à ${clientPhone}...`);
      
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

  // 2. Envoi Email via Brevo (si demandé ET email valide)
  if (sendEmail && clientEmail) {
    try {
      console.log(`Tentative envoi Email (Brevo) à ${clientEmail}...`);

      const subject = type === 'late_payment'
        ? 'JM Pominville - Retard de paiement - Action requise'
        : type === 'payment_due_reminder'
          ? 'JM Pominville - Rappel de paiement'
          : 'JM Pominville - Notification de Service';

      await sendEmailViaBrevo(clientEmail, subject, message);

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

// Route de synchronisation : sauvegarde les données de l'app côté serveur
app.post('/api/sync', (req, res) => {
  try {
    const incoming = req.body || {};
    const payload = {
      clients: incoming.clients || [],
      contracts: incoming.contracts || [],
      invoices: incoming.invoices || [],
      payments: incoming.payments || [],
      notificationsHistory: incoming.notificationsHistory || [],
      lastModified: incoming.lastModified || new Date().toISOString(),
      savedAt: new Date().toISOString()
    };

    // Garder une copie de l'ancienne version comme filet de sécurité avant d'écraser
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');

    console.log(`✅ Synchronisation reçue et sauvegardée (${payload.clients.length} clients, ${payload.contracts.length} contrats)`);

    res.json({
      success: true,
      message: 'Données synchronisées avec succès',
      counts: {
        clients: payload.clients.length,
        contracts: payload.contracts.length,
        invoices: payload.invoices.length,
        payments: payload.payments.length
      },
      savedAt: payload.savedAt
    });
  } catch (error) {
    console.error('❌ Erreur /api/sync (POST):', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour récupérer la dernière sauvegarde du serveur (utile pour restaurer sur un autre appareil)
app.get('/api/sync', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(404).json({ success: false, error: 'Aucune donnée sauvegardée trouvée sur le serveur.' });
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Erreur /api/sync (GET):', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
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
✅ Synchronisation: /api/sync (POST pour sauvegarder, GET pour récupérer)

📋 Configuration:
   - Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}
   - Brevo (Email): ${BREVO_API_KEY ? '✅' : '❌ (ajouter BREVO_API_KEY dans les variables environnement)'}
   - Dossier de données: ${DATA_DIR}${process.env.DATA_DIR ? '' : ' ⚠️ (pas de Persistent Disk configuré — les données seront perdues au prochain déploiement)'}

En attente de requêtes...
  `);
});
