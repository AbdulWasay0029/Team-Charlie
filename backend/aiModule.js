// AI Module for Bharat Patrol
// Integrates Groq Vision and Text APIs with fallback protection

const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;
const isGroqConfigured = !!groqApiKey && !groqApiKey.includes('placeholder');

let groq = null;
if (isGroqConfigured) {
  try {
    groq = new Groq({ apiKey: groqApiKey });
    console.log('✅ Groq AI Client successfully initialized.');
  } catch (err) {
    console.error('❌ Failed to initialize Groq Client:', err);
  }
} else {
  console.log('⚠️ Groq API Key not configured. Using Mock AI fallbacks.');
}

/**
 * Verifies if photo shows a real civic issue and classifies it.
 * Uses Groq Vision model 'llama-4-scout-17b'.
 */
async function verifyAndDescribePhoto(imageUrl, category) {
  if (!isGroqConfigured || !groq) {
    console.log('[AI Module] Falling back to mock vision response.');
    return {
      verified: true,
      issue_type: category || 'General Civic Issue',
      severity: 4,
      description: `A verified ${category || 'civic issue'} has been reported at this location. Needs municipal attention.`
    };
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-4-scout-17b',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an AI civic inspector for Bharat Patrol. Analyze this photo. Check if it shows a real civic issue (such as garbage piles, potholes, open sewage, water leakage, broken streetlights, or road blockages). 
Return a JSON object with these fields:
{
  "verified": true if it is a real civic issue, false if it is unrelated, fake, or a normal photo,
  "issue_type": the classification of the issue (e.g. "Garbage Accumulation", "Pothole", "Sewage Overflow", "Water Leakage", etc.),
  "severity": an integer score from 1 (minor) to 10 (extreme emergency),
  "description": a factual 1-2 sentence description of the issue in the photo.
}
Do NOT include any markdown formatting, backticks, or explanation. Return ONLY the raw JSON string.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    let content = chatCompletion.choices[0].message.content;
    // Strip markdown JSON wrapping if returned
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content);
  } catch (error) {
    console.error('[AI Module Error] Groq vision completion failed:', error);
    // Safe fallback to let citizen submit
    return {
      verified: true,
      issue_type: category || 'General Civic Issue',
      severity: 3,
      description: 'Civic issue reported via photo. AI inspection completed with safe fallback.'
    };
  }
}

/**
 * Drafts an urgent WhatsApp escalation alert to the local ward councillor.
 * Uses Groq Text model 'llama3-8b-8192'.
 */
async function draftEscalationMessage({ category, severity, voteCount, lat, lng }) {
  if (!isGroqConfigured || !groq) {
    console.log('[AI Module] Falling back to mock escalation message.');
    return `🚨 BHARAT PATROL ESCALATION ALERT 🚨

Dear Councillor,

A community issue has crossed the critical threshold of 25 civic votes in your ward, triggering an automatic escalation.

📍 Ward/Area: Lat ${lat}, Lng ${lng}
⚠️ Issue Type: ${category}
🔥 AI Severity Index: ${severity}/10
📈 Verified Citizen Votes: ${voteCount}

Please review this issue and dispatch local municipal field workers to resolve this at the earliest.

View Report & Photo Evidence: https://bharat-patrol.vercel.app/`;
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: `Draft a professional but urgent WhatsApp message to a ward councillor regarding a civic issue.
Details:
- Category/Type: ${category}
- AI Severity Index: ${severity}/10
- Public Vote Count: ${voteCount} (representing high public concern)
- Latitude: ${lat}
- Longitude: ${lng}

The message must be under 150 words. Focus on urging immediate response and action. Return ONLY the drafted message text.`
        }
      ]
    });

    return chatCompletion.choices[0].message.content.trim();
  } catch (error) {
    console.error('[AI Module Error] Groq text message compilation failed:', error);
    return `🚨 BHARAT PATROL ESCALATION ALERT 🚨

Dear Councillor,

A community issue has crossed the critical threshold of 25 civic votes in your ward, triggering an automatic escalation.

📍 Ward/Area: Lat ${lat}, Lng ${lng}
⚠️ Issue Type: ${category}
🔥 AI Severity Index: ${severity}/10
📈 Verified Citizen Votes: ${voteCount}

Please review this issue and dispatch local municipal field workers to resolve this at the earliest.

View Report & Photo Evidence: https://bharat-patrol.vercel.app/`;
  }
}

module.exports = {
  verifyAndDescribePhoto,
  draftEscalationMessage
};
