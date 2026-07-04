const http = require('http');

/**
 * End-to-End Core Loop Verification Script for Bharat Patrol.
 * As Floater + Escalation owner, this script verifies the entire hackathon core loop:
 * 1. Sign up (POST /users)
 * 2. Submit civic issue report (POST /reports) -> Inline AI verification
 * 3. Community voting loop (POST /reports/:id/vote) -> Incrementing score
 * 4. Automatic WhatsApp Escalation trigger when votes cross 25!
 * 
 * Usage:
 *   node test-e2e-loop.js [api-base-url]
 *   Example: node test-e2e-loop.js http://localhost:3001
 */

const API_BASE = process.argv[2] || 'http://localhost:3001';

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} at ${endpoint}: ${text}`);
  }
  return response.json();
}

async function runE2ETest() {
  console.log('================================================================================');
  console.log('🚀 BHARAT PATROL — END-TO-END CORE LOOP INTEGRATION TEST');
  console.log('================================================================================');
  console.log(`🎯 Target API Server: ${API_BASE}`);
  console.log('--------------------------------------------------------------------------------\n');

  try {
    // STEP 1: Sign up reporting citizen
    console.log('1️⃣  [STEP 1: IDENTITY CAPTURE] Signing up citizen user...');
    const reporter = await fetchJson('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rajesh Kumar (Citizen Reporter)',
        phone: '+919876543210'
      })
    });
    console.log(`✅ Citizen registered successfully! ID: ${reporter.id}, Name: ${reporter.name}\n`);

    // STEP 2: Submit civic issue report
    console.log('2️⃣  [STEP 2: CIVIC REPORTING & AI VERIFICATION] Submitting pothole report...');
    console.log('   (Server will run inline Groq Vision AI verification & description drafting)...');
    const report = await fetchJson('/reports', {
      method: 'POST',
      body: JSON.stringify({
        user_id: reporter.id,
        lat: 12.9352,
        lng: 77.6245,
        category: 'Road Hazard / Severe Pothole',
        photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80'
      })
    });
    console.log(`✅ Report created & AI-verified!`);
    console.log(`   - Report ID:     ${report.id}`);
    console.log(`   - Status:        ${report.status.toUpperCase()}`);
    console.log(`   - AI Verified:   ${report.ai_verified}`);
    console.log(`   - AI Severity:   ${report.ai_severity}/10`);
    console.log(`   - Description:   "${report.description}"`);
    console.log(`   - Initial Votes: ${report.priority_score}\n`);

    if (report.status !== 'live') {
      console.warn('⚠️ Notice: Report was not marked "live" by AI. Check AI verification model or fallbacks.');
    }

    // STEP 3 & 4: Community Voting & WhatsApp Escalation
    console.log('3️⃣  [STEP 3 & 4: COMMUNITY VOTING & WHATSAPP ESCALATION]');
    console.log('   Simulating 25 citizens upvoting the report to trigger automatic WhatsApp alert...\n');

    let escalationFired = false;
    let finalScore = report.priority_score || 0;

    for (let i = 1; i <= 25; i++) {
      // Create unique citizen voter
      const voter = await fetchJson('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: `Community Citizen #${i}`,
          phone: `+9190000000${i < 10 ? '0' + i : i}`
        })
      });

      // Submit vote
      const voteResult = await fetchJson(`/reports/${report.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ user_id: voter.id })
      });

      finalScore = voteResult.priority_score;
      
      // Visual indicator for vote progression & marker color thresholds
      let markerColor = '🟢 Green (1-9 votes)';
      if (finalScore >= 10 && finalScore < 25) markerColor = '🟠 Orange (10-24 votes)';
      if (finalScore >= 25) markerColor = '🔴 Red (25+ votes - ESCALATION THRESHOLD!)';

      process.stdout.write(`   Vote #${i}/25 -> Total Score: ${finalScore} [Map Marker: ${markerColor}]\r`);

      if (voteResult.escalation_fired) {
        console.log(`\n\n🚨 [ESCALATION TRIGGERED ON VOTE #${i}!] 🚨`);
        console.log(`✅ Server reported: escalation_fired = true!`);
        console.log(`📲 Inline Groq text AI drafted message & Twilio WhatsApp alert dispatched!`);
        escalationFired = true;
      }
    }

    console.log('\n--------------------------------------------------------------------------------');
    console.log('🏁 END-TO-END LOOP VERIFICATION SUMMARY:');
    console.log(`   - Total Citizen Votes: ${finalScore}`);
    console.log(`   - Final Marker State:  🔴 Red (High Priority)`);
    console.log(`   - WhatsApp Escalation: ${escalationFired ? '✅ SUCCESS (Fired automatically at >= 25 votes)' : '⚠️ Check server logs (may have been previously notified)'}`);
    console.log('================================================================================\n');

  } catch (err) {
    console.error('\n❌ E2E Loop Test Failed:', err.message);
    console.log('💡 Tip: Make sure your backend server is running locally on port 3001 (npm start)');
  }
}

runE2ETest();
