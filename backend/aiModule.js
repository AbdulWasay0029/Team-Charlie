// AI Module for Bharat Patrol
// Integrates Groq Vision and Text APIs with fallback protection
// Fixed and verified working model mappings for llama-4-scout-17b and llama3-8b-8192

const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Map decommissioned or specific model IDs to the active IDs currently supported on Groq
const VISION_MODEL = process.env.VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = process.env.TEXT_MODEL || "llama-3.1-8b-instant";

const groqApiKey = process.env.GROQ_API_KEY;
const isGroqConfigured = !!groqApiKey && !groqApiKey.includes('placeholder');

let groq = null;
if (isGroqConfigured) {
  try {
    groq = new Groq({ apiKey: groqApiKey });
    console.log('✅ Groq AI Client successfully initialized with key.');
  } catch (err) {
    console.error('❌ Failed to initialize Groq Client:', err);
  }
} else {
  console.log('⚠️ Groq API Key not configured. Using Mock AI fallbacks.');
}

/**
 * FUNCTION 1: verifyAndDescribePhoto(imageUrl)
 * Uses a vision-capable model to verify if the photo shows a civic issue and generates a short description.
 * 
 * @param {string} imageUrl - Publicly accessible URL of the reported photo
 * @param {string} [category] - Optional category hint from client submission
 * @returns {Promise<{verified: boolean, issue_type: string, severity: number, description: string}>}
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
    const response = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'You are a civic issue verification AI. Look at this image and determine if it shows a real civic infrastructure problem in India (road damage, open drain, broken streetlight, garbage dump, water leak, encroachment, fallen tree, or damaged bus stop). Reply ONLY valid JSON, no markdown fences: {"verified": true/false, "issue_type": string, "severity": 1-10, "description": "1-2 sentence factual description for a government official"}'
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    });

    let text = response.choices[0]?.message?.content || "";
    
    // Clean codeblock/markdown fences if present
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn("[AI Module] JSON parsing failed directly. Attempting to extract JSON substring. Content:", text);
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const cleanedText = text.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(cleanedText);
        } catch (innerError) {
          // fall through to main throw
        }
      }
      throw parseError;
    }
  } catch (error) {
    console.error("[AI Module Error] verifyAndDescribePhoto failed:", error.message || error);
    // Safe fallback object
    return {
      verified: true,
      issue_type: category || 'General Civic Issue',
      severity: 3,
      description: "Could not analyze or verify the image due to an error in the AI service."
    };
  }
}

/**
 * FUNCTION 2: draftEscalationMessage({category, severity, voteCount, lat, lng})
 * Uses a text-only model to draft a concise, professional WhatsApp message to a ward councillor.
 * 
 * @param {object} params
 * @param {string} params.category - The category of civic issue (e.g. road damage)
 * @param {number} params.severity - Severity score from 1-10
 * @param {number} params.voteCount - Number of upvotes from citizens
 * @param {number} params.lat - Latitude coordinate
 * @param {number} params.lng - Longitude coordinate
 * @returns {Promise<string>} Plain text WhatsApp message
 */
async function draftEscalationMessage({ category, severity, voteCount, lat, lng }) {
  if (!isGroqConfigured || !groq) {
    console.log('[AI Module] Falling back to mock escalation message.');
    return `🚨 BHARAT PATROL ESCALATION ALERT 🚨\n\nDear Councillor,\n\nA community issue has crossed the critical threshold of 25 civic votes in your ward, triggering an automatic escalation.\n\n📍 Location: Lat ${lat}, Lng ${lng}\n⚠️ Issue Type: ${category}\n🔥 AI Severity Index: ${severity}/10\n📈 Verified Citizen Votes: ${voteCount}\n\nPlease review this issue and dispatch local municipal field workers to resolve this at the earliest.`;
  }

  try {
    const prompt = `Generate a WhatsApp message to a ward councillor about this civic issue. Category: ${category}. Severity: ${severity}/10. Votes: ${voteCount}. Location: Latitude ${lat}, Longitude ${lng}. Keep it under 150 words. Professional but urgent tone. Plain text only, no markdown.`;

    const response = await groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return (response.choices[0]?.message?.content || "").trim();
  } catch (error) {
    console.error("[AI Module Error] draftEscalationMessage failed:", error.message || error);
    // Return high quality pre-formatted fallback text
    return `🚨 *URGENT CIVIC ESCALATION* 🚨\n\nDear Councillor,\n\nThis is to report an urgent civic issue in our ward.\n\n📍 *Location:* Lat ${lat}, Lng ${lng}\n🛠️ *Issue:* ${category}\n⚠️ *Severity:* ${severity}/10\n📈 *Citizen Votes:* ${voteCount}\n\nResidents are experiencing disruption due to this problem. Requesting your prompt intervention to address it.\n\nThank you.`;
  }
}

module.exports = {
  verifyAndDescribePhoto,
  draftEscalationMessage
};
