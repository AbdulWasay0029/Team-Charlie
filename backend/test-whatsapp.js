const { sendWhatsAppAlert } = require('./escalationModule');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Standalone verification script to test Twilio WhatsApp alert delivery before demo day.
 * 
 * Usage:
 *   node test-whatsapp.js <councillor-phone-number>
 *   Example: node test-whatsapp.js +919876543210
 */
async function runTest() {
  console.log('================================================================================');
  console.log('🚀 BHARAT PATROL - TWILIO WHATSAPP ESCALATION SERVICE TESTER');
  console.log('================================================================================');

  // Get recipient phone number from CLI args or default COUNCILLOR_PHONE env var
  const targetPhone = process.argv[2] || process.env.COUNCILLOR_PHONE;

  if (!targetPhone || targetPhone === '+919999999999') {
    console.warn('⚠️ Notice: No custom target phone number provided or default placeholder detected.');
    console.log('\n📖 TWILIO SANDBOX SETUP & JOIN INSTRUCTIONS (REQUIRED FOR DEMO DAY):');
    console.log('1. Open your Twilio Console -> Messaging -> Try it out -> Send a WhatsApp message.');
    console.log('2. Note your Sandbox Phone Number (usually +1 415 523 8886) and unique Sandbox Keyword (e.g., "join happy-tiger").');
    console.log('3. On your mobile phone (or the Councillor/Judge\'s WhatsApp):');
    console.log('   - Save +1 415 523 8886 as a contact.');
    console.log('   - Send an SMS/WhatsApp message with your exact keyword: "join <your-keyword>".');
    console.log('4. Once confirmed by Twilio, run this script with your phone number:');
    console.log('   node test-whatsapp.js +919876543210\n');
  }

  const phoneToUse = targetPhone || '+919876543210';
  console.log(`📋 Target Phone Number: ${phoneToUse}`);
  console.log('🛠️  Checking Environment Variables:');
  console.log(`   - TWILIO_ACCOUNT_SID:   ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing (Will use console fallback)'}`);
  console.log(`   - TWILIO_AUTH_TOKEN:    ${process.env.TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing (Will use console fallback)'}`);
  console.log(`   - TWILIO_WHATSAPP_FROM: ${process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886 (Default Sandbox)'}`);
  console.log(`   - COUNCILLOR_PHONE:     ${process.env.COUNCILLOR_PHONE || 'Not set'}`);
  console.log('--------------------------------------------------------------------------------');

  const sampleAlertText = 
`🚨 *BHARAT PATROL PRIORITY ESCALATION* 🚨

*Ward Issue:* Deep Road Caved-in / Severe Pothole
*Location:* Ward 14 (Koramangala) - Lat: 12.9352, Lng: 77.6245
*Citizen Votes:* 26 votes 🔥 (Crossed 25-vote threshold!)
*AI Severity Rating:* 9 / 10 ⚠️ (Structural Hazard)

*AI Verified Description:* Large caved-in section on main arterial road causing severe traffic obstruction and hazard to two-wheelers.

*Action Required:* Ward Councillor response and maintenance team dispatch requested immediately.`;

  console.log('📤 Sending test escalation message...');
  
  const startTime = Date.now();
  const result = await sendWhatsAppAlert(phoneToUse, sampleAlertText);
  const duration = Date.now() - startTime;

  console.log('--------------------------------------------------------------------------------');
  console.log('🏁 TEST RESULT SUMMARY:');
  console.log(`   - Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   - Delivery Provider: ${result.provider}`);
  if (result.messageSid) {
    console.log(`   - Message SID: ${result.messageSid}`);
  }
  console.log(`   - Execution Time: ${duration}ms`);
  console.log('================================================================================\n');
}

runTest().catch(err => {
  console.error('❌ Unexpected test script failure:', err);
  process.exit(1);
});
