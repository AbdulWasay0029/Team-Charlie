// Escalation Module for TraceSpark
// Integrates with Twilio WhatsApp Gateway with console dispatches fallback

const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default

const isTwilioConfigured = 
  !!accountSid && 
  !!authToken && 
  !accountSid.includes('placeholder') && 
  !authToken.includes('placeholder');

let client = null;
if (isTwilioConfigured) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio Client successfully initialized.');
  } catch (err) {
    console.error('❌ Failed to initialize Twilio Client:', err);
  }
} else {
  console.log('⚠️ Twilio Credentials not fully configured. WhatsApp alerts will print to console fallback.');
}

/**
 * Dispatches a WhatsApp alert to the ward councillor.
 * Falls back to console printing if Twilio fails or is unconfigured.
 */
async function sendWhatsAppAlert(toPhoneNumber, messageText) {
  if (!isTwilioConfigured || !client) {
    return printConsoleFallback(toPhoneNumber, messageText, 'Twilio unconfigured');
  }

  try {
    const formattedTo = toPhoneNumber.startsWith('whatsapp:') ? toPhoneNumber : `whatsapp:${toPhoneNumber}`;
    const formattedFrom = fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;

    console.log(`[Twilio] Dispatching WhatsApp message to ${formattedTo}...`);
    const message = await client.messages.create({
      body: messageText,
      from: formattedFrom,
      to: formattedTo
    });

    console.log(`[Twilio] Alert successfully sent. SID: ${message.sid}`);
    return {
      success: true,
      messageSid: message.sid,
      provider: 'Twilio Gateway'
    };
  } catch (error) {
    console.error('[Twilio Error] Failed to send WhatsApp message via API:', error.message);
    return printConsoleFallback(toPhoneNumber, messageText, `Twilio error: ${error.message}`);
  }
}

function printConsoleFallback(to, text, reason) {
  console.log('\n--- TRACESPARK WHATSAPP ESCALATION (CONSOLE FALLBACK) ---');
  console.log(`Reason: ${reason}`);
  console.log(`To: ${to}`);
  console.log(`Message:\n${text}`);
  console.log('----------------------------------------------------------\n');
  
  return {
    success: true,
    messageSid: `MOCK_SID_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    provider: 'Mock Console Fallback'
  };
}

module.exports = { sendWhatsAppAlert };
