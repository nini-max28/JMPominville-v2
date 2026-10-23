// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_SENDER_EMAIL = Deno.env.get("EMAIL_FROM_ADDRESS") || "jmpominvilledeneigement@gmail.com";
const BREVO_SENDER_NAME = Deno.env.get("EMAIL_FROM_NAME") || "JM Pominville";
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

// Vérifie que la requête vient d'une personne connectée avec le bon compte
async function isAuthorized(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) return false;

  const allowedEmail = Deno.env.get("ALLOWED_EMAIL");
  if (allowedEmail) {
    const userEmail = (data.user.email || "").toLowerCase();
    if (userEmail !== allowedEmail.toLowerCase()) return false;
  }
  return true;
}

async function sendEmailViaBrevo(toEmail: string, subject: string, message: string) {
  if (!BREVO_API_KEY) throw new Error("Configuration Brevo manquante");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject,
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
      `,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Erreur Brevo (HTTP ${response.status})`);
  return data;
}

async function sendSmsViaTwilio(toPhone: string, message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) throw new Error("Configuration Twilio manquante");

  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        Body: message,
        From: TWILIO_PHONE_NUMBER || "",
        To: toPhone,
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Erreur Twilio (HTTP ${response.status})`);
  return data;
}

Deno.serve(async (req) => {
  // Accès réservé : seulement une personne connectée avec le bon compte
  if (!(await isAuthorized(req))) {
    return Response.json(
      { success: false, error: "Non autorisé" },
      { status: 401 }
    );
  }

  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      type,
      customMessage,
      sendSms = true,
      sendEmail = true,
    } = await req.json();

    const messages: Record<string, string> = {
      enroute: `🚛 JM Pominville - Notre équipe est en route vers votre secteur. Merci de libérer votre entrée!`,
      arrived: `📍 JM Pominville - Notre équipe est arrivée dans votre secteur et commence le déneigement.`,
      completed: `✅ JM Pominville - Le déneigement de votre entrée est terminé. Merci de votre confiance!`,
      payment_due_reminder: `📅 JM Pominville - Bonjour ${clientName}, votre paiement pour les services de déneigement était dû hier. Si nous ne recevons pas votre paiement dans les 5 prochains jours, nous devrons procéder au retrait de vos piquets. Merci de régulariser rapidement ou de communiquer avec nous au 514-444-6324.`,
      late_payment: `⚠️ JM Pominville - Bonjour ${clientName}, votre paiement accuse un retard de plus de 7 jours. Sans régularisation rapide, nous procéderons au retrait de vos piquets et à la résiliation du contrat pour le reste de la période de déneigement. Merci de communiquer avec nous au 514-444-6324 dès que possible.`,
      custom: customMessage || "",
    };

    const message = messages[type] || messages.custom;

    let smsResult: Record<string, unknown> = { success: false, error: null, skipped: !sendSms };
    let emailResult: Record<string, unknown> = { success: false, error: null, skipped: !sendEmail };

    if (sendSms && clientPhone) {
      try {
        await sendSmsViaTwilio(clientPhone, message);
        smsResult.success = true;
      } catch (error) {
        smsResult.error = (error as Error).message;
      }
    }

    if (sendEmail && clientEmail) {
      try {
        const subject = type === "late_payment"
          ? "JM Pominville - Retard de paiement - Action requise"
          : type === "payment_due_reminder"
          ? "JM Pominville - Rappel de paiement"
          : "JM Pominville - Notification de Service";

        await sendEmailViaBrevo(clientEmail, subject, message);
        emailResult.success = true;
      } catch (error) {
        emailResult.error = (error as Error).message;
      }
    }

    const overallSuccess = smsResult.success || emailResult.success;

    return Response.json({
      success: overallSuccess,
      sms: smsResult,
      email: emailResult,
      message: overallSuccess ? "Au moins une notification envoyée" : "Échec d'envoi des notifications",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
});
