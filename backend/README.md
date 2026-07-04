# 🚨 Bharat Patrol — Backend & Escalation Service

This backend powers the **Bharat Patrol** civic issue reporting app. It features inline AI photo verification (Groq Vision) and automated high-priority WhatsApp escalations via Twilio Sandbox.

---

## 📲 1. Twilio WhatsApp Sandbox Setup (CRITICAL FOR DEMO DAY!)

Before presenting or testing live, **the recipient phone number (Councillor or Judge) must join your Twilio WhatsApp Sandbox once**. If they do not join, Twilio will reject the API request!

### Step-by-Step Join Instructions:
1. Open your **Twilio Console** -> **Messaging** -> **Try it out** -> **Send a WhatsApp message**.
2. Note your Sandbox Phone Number (usually `+1 415 523 8886`) and your unique **Sandbox Keyword** (e.g., `join happy-tiger` or `join metal-rocket`).
3. **On your mobile phone (WhatsApp)**:
   - Save `+1 415 523 8886` as a contact (e.g., "Twilio Sandbox").
   - Send an SMS/WhatsApp message with your exact join keyword:
     ```text
     join <your-sandbox-keyword>
     ```
4. You will receive a confirmation message from Twilio: *"You are all set! The sandbox can now send you messages."*
5. **Ready!** When any civic report crosses **25 citizen votes**, the automated WhatsApp escalation will arrive instantly on this phone.

> [!TIP]
> **Hackathon Fail-Safe Guarantee**: If Twilio credentials are missing on Render, or if WhatsApp delivery experiences network issues during judging, our code **will not crash or throw a 500 error**. Instead, it automatically switches to **Console Fallback Mode**, printing the fully drafted WhatsApp alert banner into the server logs!

---

## ⚙️ 2. Environment Variables (Render & Local `.env`)

Add the following environment variables to your local `backend/.env` file or Render Service Environment Settings:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `3001` |
| `SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase Service / Secret Key | `eyJhbGciOi...` |
| `GROQ_API_KEY` | Groq API Key for Vision & Text models | `gsk_...` |
| `TWILIO_ACCOUNT_SID` | Found on Twilio account dashboard | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Found on Twilio account dashboard | `your_auth_token_secret` |
| `TWILIO_WHATSAPP_FROM` | Twilio Sandbox WhatsApp number | `whatsapp:+14155238886` |
| `COUNCILLOR_PHONE` | Target phone number for WhatsApp alerts | `+919876543210` |

---

## 🧪 3. Standalone Verification Scripts

We have created two standalone testing scripts so you can verify everything before demo day:

### A. Test Twilio WhatsApp Delivery Today
Run this script to verify that WhatsApp alerts arrive on your phone:
```bash
npm run test:whatsapp -- +919876543210
```

### B. Test Full End-to-End Loop (Floater Verification)
Run this script to simulate the entire core civic loop against the running server (Signup -> Report -> 25 Votes -> WhatsApp Trigger):
```bash
node test-e2e-loop.js http://localhost:3001
```
