const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Fonction d'envoi d'email
async function sendEmail(to, subject, text, html) {
    try {
        const info = await transporter.sendMail({
            from: {
                name: process.env.EMAIL_FROM_NAME || 'JM Pominville',
                address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
            },
            to: to,
            subject: subject,
            text: text,
            html: html || `
                <div style="font-family: Arial, sans-serif;">
                    <h2>JM Pominville - Services de Déneigement</h2>
                    <p style="white-space: pre-line;">${text}</p>
                </div>
            `
        });

        console.log('✅ Email envoyé:', info.messageId);
        return {
            success: true,
            messageId: info.messageId,
            to: to,
            subject: subject
        };
    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        return {
            success: false,
            error: error.message,
            to: to
        };
    }
}

// Test de connexion email
async function testEmailConnection() {
    try {
        await transporter.verify();
        return {
            success: true,
            message: 'Connexion email OK'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sendEmail,
    testEmailConnection,
    transporter
};