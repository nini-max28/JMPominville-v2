const twilio = require('twilio');

// Configuration Twilio pour SMS
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Fonction d'envoi SMS
async function sendSMS(phoneNumber, message) {
    try {
        if (!twilioClient) {
            console.log('⚠️ SMS non configuré pour:', phoneNumber);
            return {
                success: false,
                simulated: true,
                error: 'Configuration SMS manquante',
                to: phoneNumber
            };
        }

        // Formater le numéro (ajouter +1 si nécessaire)
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.length === 10) {
            formattedPhone = `+1${formattedPhone}`;
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            formattedPhone = `+${formattedPhone}`;
        } else {
            formattedPhone = `+${formattedPhone}`;
        }

        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });

        console.log('✅ SMS envoyé:', result.sid);
        return {
            success: true,
            messageId: result.sid,
            to: formattedPhone,
            status: result.status
        };
    } catch (error) {
        console.error('❌ Erreur envoi SMS:', error.message);
        return {
            success: false,
            error: error.message,
            to: phoneNumber
        };
    }
}

// Test de connexion SMS
async function testSMSConnection() {
    if (!twilioClient) {
        return { 
            success: false, 
            error: 'Client Twilio non configuré' 
        };
    }

    try {
        const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        return {
            success: true,
            accountSid: account.sid,
            status: account.status
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sendSMS,
    testSMSConnection,
    twilioClient
};