require('dotenv').config();
const { sendSMS, formatPhoneNumber } = require('./services/smsService');
const { sendEmail, validateEmail } = require('./services/emailService');

/**
 * Script de test complet pour les services de notification
 */

async function runTests() {
  console.log('🧪 TESTS DU SYSTÈME DE NOTIFICATIONS JM POMINVILLE');
  console.log('='.repeat(60));
  
  // Configuration actuelle
  console.log('\n📋 Configuration actuelle:');
  console.log(`   Mode: ${process.env.TEST_MODE === 'true' ? 'TEST (simulation)' : 'PRODUCTION (envoi réel)'}`);
  console.log(`   Twilio configuré: ${!!process.env.TWILIO_ACCOUNT_SID}`);
  console.log(`   Email configuré: ${!!process.env.EMAIL_USER}`);
  
  // Test 1: Formatage des numéros de téléphone
  console.log('\n📱 Test 1: Formatage des numéros de téléphone');
  const testPhones = [
    '514-555-0123',
    '5145550123', 
    '+15145550123',
    '15145550123'
  ];
  
  testPhones.forEach(phone => {
    try {
      const formatted = formatPhoneNumber(phone);
      console.log(`   ✅ ${phone} → ${formatted}`);
    } catch (error) {
      console.log(`   ❌ ${phone} → Erreur: ${error.message}`);
    }
  });
  
  // Test 2: Validation des emails
  console.log('\n📧 Test 2: Validation des emails');
  const testEmails = [
    'test@example.com',
    'client@gmail.com',
    'invalid-email',
    'test@'
  ];
  
  testEmails.forEach(email => {
    const isValid = validateEmail(email);
    console.log(`   ${isValid ? '✅' : '❌'} ${email} → ${isValid ? 'Valide' : 'Invalide'}`);
  });
  
  // Test 3: Envoi SMS de test
  console.log('\n📱 Test 3: Envoi SMS de test');
  try {
    const smsResult = await sendSMS('514-555-0123', 'Test SMS de JM Pominville - Système opérationnel!');
    console.log(`   ${smsResult.success ? '✅' : '❌'} SMS: ${smsResult.success ? 'Succès' : 'Échec'}`);
    if (smsResult.simulated) console.log('   ℹ️  Mode simulation activé');
    if (!smsResult.success) console.log(`   Erreur: ${smsResult.error}`);
  } catch (error) {
    console.log(`   ❌ SMS: Erreur - ${error.message}`);
  }
  
  // Test 4: Envoi Email de test
  console.log('\n📧 Test 4: Envoi Email de test');
  try {
    const emailResult = await sendEmail(
      'test@example.com', 
      'Test JM Pominville - Système opérationnel',
      'Ceci est un test du système de notifications email de JM Pominville.'
    );
    console.log(`   ${emailResult.success ? '✅' : '❌'} Email: ${emailResult.success ? 'Succès' : 'Échec'}`);
    if (emailResult.simulated) console.log('   ℹ️  Mode simulation activé');
    if (!emailResult.success) console.log(`   Erreur: ${emailResult.error}`);
  } catch (error) {
    console.log(`   ❌ Email: Erreur - ${error.message}`);
  }
  
  // Résumé final
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  
  if (process.env.TEST_MODE === 'true') {
    console.log('✅ Système en mode TEST - Toutes les notifications sont simulées');
    console.log('   Pour activer les envois réels:');
    console.log('   1. Configurez vos clés API dans .env');
    console.log('   2. Changez TEST_MODE=false');
    console.log('   3. Relancez les tests');
  } else {
    console.log('🚀 Système en mode PRODUCTION - Les notifications sont envoyées');
    console.log('   Vérifiez que vous avez bien configuré:');
    console.log('   - Twilio (SMS)');
    console.log('   - Gmail (Email)');
  }
  
  console.log('\n🔗 Endpoints disponibles:');
  console.log('   POST /api/notifications/send - Envoyer une notification');
  console.log('   POST /api/notifications/test - Test manuel');
  console.log('   GET /api/status - Statut des services');
  console.log('   GET /api/test - Test de connectivité');
  
  console.log('\n✨ Tests terminés!');
}

// Exécution des tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
