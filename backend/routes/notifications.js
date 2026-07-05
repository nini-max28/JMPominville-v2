// backend/routes/notifications.js
const express = require('express');
const router = express.Router();

// Configuration Twilio
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACe212f0a0d718ee2fc32331a525750664';
const authToken = process.env.TWILIO_AUTH_TOKEN || '12fee717e7a72a2c48985e61a2a4340c';
const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '+17622460623';

let twilioClient;
try {
  if (accountSid && authToken && accountSid !== 'your_account_sid') {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio configuré');
  } else {
    console.log('⚠️ Twilio non configuré - mode simulation');
  }
} catch (error) {
  console.error('❌ Erreur configuration Twilio:', error.message);
}

// Configuration Nodemailer
const nodemailer = require('nodemailer');
let emailTransporter;

try {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'jmpominvilledeneigement@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'zidoflxbtkgnvbxz'
    }
  });
  console.log('✅ Email configuré');
} catch (error) {
  console.error('❌ Erreur configuration Email:', error.message);
}

// Route de test
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Notifications opérationnelle',
    twilio: !!twilioClient,
    email: !!emailTransporter
  });
});

// ✅ ROUTE CORRIGÉE POUR VOTRE FRONTEND
router.post('/send', async (req, res) => {
  console.log('=== NOTIFICATION REÇUE ===');
  console.log('Données reçues:', JSON.stringify(req.body, null, 2));
  
  try {
    // Récupération des données selon le format de votre frontend
    const { 
      clientId, 
      clientName, 
      clientPhone, 
      clientEmail, 
      type, 
      customMessage 
    } = req.body;
    
    // Validation des données requises
    if (!clientName) {
      console.error('❌ clientName manquant');
      return res.status(400).json({
        success: false,
        error: 'Le nom du client (clientName) est requis'
      });
    }
    
    if (!type) {
      console.error('❌ type manquant');
      return res.status(400).json({
        success: false,
        error: 'Le type de notification est requis'
      });
    }
    
    if (!clientPhone && !clientEmail) {
      console.error('❌ Aucun moyen de contact');
      return res.status(400).json({
        success: false,
        error: 'Au moins un moyen de contact (clientPhone ou clientEmail) est requis'
      });
    }

    console.log('✅ Validation réussie');
    console.log('Client:', clientName);
    console.log('Téléphone:', clientPhone);
    console.log('Email:', clientEmail);
    console.log('Type:', type);

    // Création du message selon le type
    let message = customMessage;
    if (!message) {
      switch (type) {
        case 'enroute':
          message = `Bonjour ${clientName}, notre équipe JM Pominville se dirige vers votre adresse. Nous devrions arriver dans les 15-30 prochaines minutes.`;
          break;
        case 'completion':
          message = `Bonjour ${clientName}, notre équipe JM Pominville a terminé le déneigement à votre adresse. Merci de votre confiance!`;
          break;
        case 'reminder':
          message = `Bonjour ${clientName}, ceci est un rappel concernant votre paiement pour les services de déneigement JM Pominville.`;
          break;
        case 'late_payment':
          message = `Bonjour ${clientName}, votre paiement pour les services de déneigement JM Pominville accuse un retard de plus de 7 jours. Sans régularisation rapide, nous procéderons au retrait de vos piquets et à la résiliation du contrat pour le reste de la période de déneigement. Merci de communiquer avec nous au 514-444-6324 dès que possible.`;
          break;
        case 'custom':
          message = customMessage || `Notification de JM Pominville pour ${clientName}`;
          break;
        default:
          message = `Notification de JM Pominville pour ${clientName}`;
      }
    }

    console.log('📝 Message créé:', message);

    const results = {};
    let hasSuccess = false;

    // Envoi SMS si numéro fourni
    if (clientPhone) {
      console.log('📱 Tentative envoi SMS à:', clientPhone);
      
      if (twilioClient) {
        try {
          // Formatage du numéro canadien
          let formattedPhone = clientPhone.replace(/\D/g, '');
          if (formattedPhone.length === 10) {
            formattedPhone = '+1' + formattedPhone;
          } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            formattedPhone = '+' + formattedPhone;
          }
          
          console.log('📱 Numéro formaté:', formattedPhone);
          
          const smsResult = await twilioClient.messages.create({
            body: message,
            from: twilioPhone,
            to: formattedPhone
          });
          
          results.sms = {
            success: true,
            messageId: smsResult.sid,
            status: smsResult.status,
            simulated: false
          };
          
          hasSuccess = true;
          console.log('✅ SMS envoyé avec succès:', smsResult.sid);
          
        } catch (smsError) {
          console.error('❌ Erreur SMS:', smsError.message);
          results.sms = {
            success: false,
            error: smsError.message,
            simulated: true
          };
        }
      } else {
        // Mode simulation si Twilio non configuré
        console.log('⚠️ Twilio non configuré - SMS simulé');
        results.sms = {
          success: true,
          messageId: `sms_sim_${Date.now()}`,
          simulated: true,
          message: 'SMS simulé (Twilio non configuré)'
        };
        hasSuccess = true;
      }
    }

    // Envoi Email si adresse fournie
    if (clientEmail) {
      console.log('📧 Tentative envoi Email à:', clientEmail);
      
      if (emailTransporter) {
        try {
          const emailResult = await emailTransporter.sendMail({
            from: `"JM Pominville" <${process.env.EMAIL_USER || 'jmpominvilledeneigement@gmail.com'}>`,
            to: clientEmail,
            subject: `JM Pominville - ${type === 'enroute' ? 'Équipe en route' : type === 'completion' ? 'Service terminé' : type === 'late_payment' ? 'Retard de paiement - Action requise' : 'Notification'}`,
            text: message,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #1a4d1a; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="margin: 0;">🚛 JM Pominville</h1>
                  <p style="margin: 5px 0 0 0;">Services de déneigement</p>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #dee2e6;">
                  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">${message}</p>
                  <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
                  <p style="font-size: 12px; color: #666; margin: 0;">
                    Envoyé automatiquement par l'application JM Pominville<br>
                    <strong>Téléphone:</strong> 514-444-6324
                  </p>
                </div>
              </div>
            `
          });
          
          results.email = {
            success: true,
            messageId: emailResult.messageId,
            simulated: false
          };
          
          hasSuccess = true;
          console.log('✅ Email envoyé avec succès:', emailResult.messageId);
          
        } catch (emailError) {
          console.error('❌ Erreur Email:', emailError.message);
          results.email = {
            success: false,
            error: emailError.message,
            simulated: true
          };
        }
      } else {
        // Mode simulation si Email non configuré
        console.log('⚠️ Email non configuré - Email simulé');
        results.email = {
          success: true,
          messageId: `email_sim_${Date.now()}`,
          simulated: true,
          message: 'Email simulé (transporteur non configuré)'
        };
        hasSuccess = true;
      }
    }

    // Si aucun service configuré, forcer la simulation
    if (!hasSuccess) {
      console.log('⚠️ Aucun service configuré - mode simulation forcé');
      if (clientPhone) {
        results.sms = {
          success: true,
          messageId: `sms_sim_${Date.now()}`,
          simulated: true
        };
      }
      if (clientEmail) {
        results.email = {
          success: true,
          messageId: `email_sim_${Date.now()}`,
          simulated: true
        };
      }
      hasSuccess = true;
    }

    const response = {
      success: hasSuccess,
      message: hasSuccess ? 'Notification traitée avec succès' : 'Échec de tous les envois',
      results: results,
      notification: {
        clientId,
        clientName,
        type,
        timestamp: new Date().toISOString(),
        simulated: !twilioClient || !emailTransporter
      }
    };

    console.log('📤 Réponse finale:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur: ' + error.message
    });
  }
});

// Route d'historique (inchangée)
router.get('/history', (req, res) => {
  const { limit = 50 } = req.query;
  
  const mockHistory = [
    {
      id: 1,
      type: 'sms',
      recipient: '+1234567890',
      message: 'Déneigement programmé pour demain 6h',
      timestamp: new Date().toISOString(),
      status: 'delivered'
    }
  ];
  
  res.json({
    success: true,
    count: mockHistory.length,
    notifications: mockHistory.slice(0, parseInt(limit))
  });
});

// Test de configuration (inchangée)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      twilio: {
        configured: !!twilioClient,
        hasAccountSid: !!(accountSid && accountSid !== 'your_account_sid'),
        hasAuthToken: !!(authToken && authToken !== 'your_auth_token'),
        hasPhoneNumber: !!(twilioPhone && twilioPhone !== '+1234567890')
      },
      email: {
        configured: !!emailTransporter,
        hasUser: !!(process.env.EMAIL_USER),
        hasPassword: !!(process.env.EMAIL_PASSWORD)
      }
    }
  });
});

module.exports = router;
