const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Check if credentials are set and are not placeholder values
const isConfigured = 
  !!supabaseUrl && 
  !!supabaseKey && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseKey.includes('your-supabase-service-role-key');

let supabase = null;

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client successfully initialized!');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
  }
} else {
  console.log('⚠️ Supabase credentials not fully configured. API will run in stateful MOCK fallback mode.');
}

module.exports = {
  supabase,
  isConfigured
};
