require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 10000;

// Connexion Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

// ========== CONVERSION ENTRE LE FORMAT DE L'APP (camelCase) ET SUPABASE (snake_case) ==========

function clientToDb(c) {
  return {
    id: Math.round(c.id),

    name: c.name || '',
    phone: c.phone || '',
    phone2: c.phone2 || '',
    email: c.email || '',
    type: c.type || '',
    address: c.address || '',
    payment_structure: c.paymentStructure || '2',
    first_payment_date: c.firstPaymentDate || '',
    first_payment_method: c.firstPaymentMethod || '',
    first_payment_received: !!c.firstPaymentReceived,
    second_payment_date: c.secondPaymentDate || '',
    second_payment_method: c.secondPaymentMethod || '',
    second_payment_received: !!c.secondPaymentReceived,
    third_payment_date: c.thirdPaymentDate || '',
    third_payment_method: c.thirdPaymentMethod || '',
    third_payment_received: !!c.thirdPaymentReceived,
    fourth_payment_date: c.fourthPaymentDate || '',
    fourth_payment_method: c.fourthPaymentMethod || '',
    fourth_payment_received: !!c.fourthPaymentReceived,
    notes: c.notes || '',
    payment_reminder_sent_at: c.paymentReminderSentAt || null,
    late_payment_warning_sent_at: c.latePaymentWarningSentAt || null
  };
}

function clientFromDb(c) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    phone2: c.phone2,
    email: c.email,
    type: c.type,
    address: c.address,
    paymentStructure: c.payment_structure,
    firstPaymentDate: c.first_payment_date,
    firstPaymentMethod: c.first_payment_method,
    firstPaymentReceived: c.first_payment_received,
    secondPaymentDate: c.second_payment_date,
    secondPaymentMethod: c.second_payment_method,
    secondPaymentReceived: c.second_payment_received,
    thirdPaymentDate: c.third_payment_date,
    thirdPaymentMethod: c.third_payment_method,
    thirdPaymentReceived: c.third_payment_received,
    fourthPaymentDate: c.fourth_payment_date,
    fourthPaymentMethod: c.fourth_payment_method,
    fourthPaymentReceived: c.fourth_payment_received,
    notes: c.notes,
    paymentReminderSentAt: c.payment_reminder_sent_at,
    latePaymentWarningSentAt: c.late_payment_warning_sent_at
  };
}

function contractToDb(c) {
  return {
    id: Math.round(c.id),

    client_id: c.clientId,
    type: c.type || '',
    start_date: c.startDate || '',
    end_date: c.endDate || '',
    amount: c.amount || 0,
    status: c.status || 'actif',
    notes: c.notes || '',
    entrees_completes: c.entreesCompletes || 0,
    devants_tempo: c.devantsTempo || 0,
    stationnements_commerciaux: c.stationnementsCommerciaux || 0,
    instructions_entrees: c.instructionsEntrees || '',
    instructions_tempo: c.instructionsTempo || '',
    instructions_commercial: c.instructionsCommercial || '',
    created_at: c.createdAt || null,
    renewed_from: c.renewedFrom || null,
    archived: !!c.archived,
    not_renewed: !!c.notRenewed,
    year_archived: c.yearArchived || null,
    archived_date: c.archivedDate || null
  };
}

function contractFromDb(c) {
  return {
    id: c.id,
    clientId: c.client_id,
    type: c.type,
    startDate: c.start_date,
    endDate: c.end_date,
    amount: c.amount,
    status: c.status,
    notes: c.notes,
    entreesCompletes: c.entrees_completes,
    devantsTempo: c.devants_tempo,
    stationnementsCommerciaux: c.stationnements_commerciaux,
    instructionsEntrees: c.instructions_entrees,
    instructionsTempo: c.instructions_tempo,
    instructionsCommercial: c.instructions_commercial,
    createdAt: c.created_at,
    renewedFrom: c.renewed_from,
    archived: c.archived,
    notRenewed: c.not_renewed,
    yearArchived: c.year_archived,
    archivedDate: c.archived_date
  };
}

function paymentToDb(p) {
  return {
    id: Math.round(p.id),

    client_id: p.clientId,
    contract_id: p.contractId || null,
    payment_number: p.paymentNumber,
    amount: p.amount || 0,
    date: p.date || '',
    payment_method: p.paymentMethod || '',
    cheque_number: p.chequeNumber || '',
    received: p.received !== false,
    deposited: !!p.deposited,
    deposit_date: p.depositDate || null,
    recorded_at: p.recordedAt || null,
    auto_marked: !!p.autoMarked
  };
}

function paymentFromDb(p) {
  return {
    id: p.id,
    clientId: p.client_id,
    contractId: p.contract_id,
    paymentNumber: p.payment_number,
    amount: p.amount,
    date: p.date,
    paymentMethod: p.payment_method,
    chequeNumber: p.cheque_number,
    received: p.received,
    deposited: p.deposited,
    depositDate: p.deposit_date,
    recordedAt: p.recorded_at,
    autoMarked: p.auto_marked
  };
}

function invoiceToDb(inv) {
  return {
    id: Math.round(inv.id),

    client_id: inv.clientId || null,
    amount: inv.amount || 0,
    date: inv.date || '',
    type: inv.type || '',
    description: inv.description || ''
  };
}

function invoiceFromDb(inv) {
  return {
    id: inv.id,
    clientId: inv.client_id,
    amount: inv.amount,
    date: inv.date,
    type: inv.type,
    description: inv.description
  };
}

// ========== ROUTES ==========

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

  const messages = {
    enroute: `🚛 JM Pominville - Notre équipe est en route vers votre secteur. Merci de libérer votre entrée!`,
    arrived: `📍 JM Pominville - Notre équipe est arrivée dans votre secteur et commence le déneigement.`,
    completed: `✅ JM Pominville - Le déneigement de votre entrée est terminé. Merci de votre confiance!`,
    payment_due_reminder: `📅 JM Pominville - Bonjour ${clientName}, votre paiement pour les services de déneigement était dû hier. Si nous ne recevons pas votre paiement dans les 5 prochains jours, nous devrons procéder au retrait de vos piquets. Merci de régulariser rapidement ou de communiquer avec nous au 514-444-6324.`,
    late_payment: `⚠️ JM Pominville - Bonjour ${clientName}, votre paiement accuse un retard de plus de 7 jours. Sans régularisation rapide, nous procéderons au retrait de vos piquets et à la résiliation du contrat pour le reste de la période de déneigement. Merci de communiquer avec nous au 514-444-6324 dès que possible.`,
    custom: customMessage || ''
  };

  const message = messages[type] || messages.custom;

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

// Route de synchronisation : sauvegarde les données de l'app dans Supabase
app.post('/api/sync', async (req, res) => {
  try {
    const incoming = req.body || {};
    const clients = incoming.clients || [];
    const contracts = incoming.contracts || [];
    const invoices = incoming.invoices || [];
    const payments = incoming.payments || [];
        const realLastModified = incoming.lastModified || new Date().toISOString();

    await supabase.from('sync_meta').upsert({ id: 1, last_modified: realLastModified });

    if (clients.length > 0) {
      const { error } = await supabase.from('clients').upsert(clients.map(clientToDb), { onConflict: 'id' });
      if (error) throw error;
    }
    if (contracts.length > 0) {
      const { error } = await supabase.from('contracts').upsert(contracts.map(contractToDb), { onConflict: 'id' });
      if (error) throw error;
    }
    if (payments.length > 0) {
      const { error } = await supabase.from('payments').upsert(payments.map(paymentToDb), { onConflict: 'id' });
      if (error) throw error;
    }
    if (invoices.length > 0) {
      const { error } = await supabase.from('invoices').upsert(invoices.map(invoiceToDb), { onConflict: 'id' });
      if (error) throw error;
    }


    console.log(`✅ Synchronisation Supabase réussie (${clients.length} clients, ${contracts.length} contrats)`);

    res.json({
      success: true,
      message: 'Données synchronisées avec succès (Supabase)',
      counts: {
        clients: clients.length,
        contracts: contracts.length,
        invoices: invoices.length,
        payments: payments.length
      },
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur /api/sync (POST):', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour récupérer les données depuis Supabase
app.get('/api/sync', async (req, res) => {
  try {
    const [clientsRes, contractsRes, paymentsRes, invoicesRes, metaRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('contracts').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('sync_meta').select('*').eq('id', 1).maybeSingle()
    ]);

    if (clientsRes.error) throw clientsRes.error;
    if (contractsRes.error) throw contractsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    if (invoicesRes.error) throw invoicesRes.error;

        const data = {
      clients: (clientsRes.data || []).map(clientFromDb),
      contracts: (contractsRes.data || []).map(contractFromDb),
      payments: (paymentsRes.data || []).map(paymentFromDb),
      invoices: (invoicesRes.data || []).map(invoiceFromDb),
      notificationsHistory: [],
      lastModified: (metaRes.data && metaRes.data.last_modified) || null
    };

    if (data.clients.length === 0 && data.contracts.length === 0) {
      return res.status(404).json({ success: false, error: 'Aucune donnée sauvegardée trouvée sur le serveur.' });
    }

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
✅ Synchronisation: /api/sync (Supabase)

📋 Configuration:
   - Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}
   - Brevo (Email): ${BREVO_API_KEY ? '✅' : '❌ (ajouter BREVO_API_KEY dans les variables environnement)'}
   - Supabase: ${process.env.SUPABASE_URL ? '✅' : '❌ (ajouter SUPABASE_URL et SUPABASE_KEY)'}

En attente de requêtes...
  `);
});
