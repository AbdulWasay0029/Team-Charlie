const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/ansar/OneDrive/Documents/Major Projects/Team Charlie/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dummies = [
  {
    user_id: 'dd6f607e-7cc9-4dbe-9525-2c69169583d0', // Sameer's citizen user ID
    lat: 17.4430,
    lng: 78.3730,
    category: 'open_drain',
    description: 'Uncovered sewer canal near Gachibowli IT Corridor. Escalation demonstration: upvote once to trigger WhatsApp notification!',
    photo_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
    ai_verified: true,
    ai_severity: 8,
    status: 'live',
    priority_score: 24
  },
  {
    user_id: 'dd6f607e-7cc9-4dbe-9525-2c69169583d0',
    lat: 17.4120,
    lng: 78.4350,
    category: 'garbage', // Correct category key
    description: 'Overflowing commercial waste heap near Jubilee Hills Road No. 36. Escalation demonstration: upvote once to trigger WhatsApp notification!',
    photo_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    ai_verified: true,
    ai_severity: 8,
    status: 'live',
    priority_score: 24
  },
  {
    user_id: 'dd6f607e-7cc9-4dbe-9525-2c69169583d0',
    lat: 17.3620,
    lng: 78.4750,
    category: 'road_damage',
    description: 'Deep road potholes near Charminar heritage pathway. Escalation demonstration: upvote once to trigger WhatsApp notification!',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    ai_verified: true,
    ai_severity: 8,
    status: 'live',
    priority_score: 24
  },
  {
    user_id: 'dd6f607e-7cc9-4dbe-9525-2c69169583d0',
    lat: 17.4150,
    lng: 78.4620,
    category: 'streetlight', // Correct category key
    description: 'Dark grid and failed street lighting system near Khairatabad metro station. Escalation demonstration: upvote once to trigger WhatsApp notification!',
    photo_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
    ai_verified: true,
    ai_severity: 8,
    status: 'live',
    priority_score: 24
  }
];

async function run() {
  console.log('Cleaning up old dummy reports with invalid category keys...');
  const { error: deleteError } = await supabase
    .from('reports')
    .delete()
    .in('category', ['garbage_pile', 'street_light']);

  if (deleteError) {
    console.error('Error during cleanup:', deleteError);
  } else {
    console.log('Successfully cleaned up old dummy reports.');
  }

  console.log('Inserting 4 dummy reports around Hyderabad with correct category keys and priority_score=24...');
  for (const report of dummies) {
    try {
      // Prevent duplicates by checking latitude & longitude first
      const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('lat', report.lat)
        .eq('lng', report.lng)
        .maybeSingle();

      if (existing) {
        console.log(`Report at lat: ${report.lat}, lng: ${report.lng} already exists. Updating score to 24...`);
        await supabase
          .from('reports')
          .update({ category: report.category, priority_score: 24 })
          .eq('id', existing.id);
      } else {
        const { data, error } = await supabase
          .from('reports')
          .insert([report])
          .select()
          .single();

        if (error) {
          console.error(`Error inserting report at ${report.lat}, ${report.lng}:`, error);
        } else {
          console.log(`Successfully inserted dummy report ID: ${data.id}`);
        }
      }
    } catch (err) {
      console.error('Caught error during insertion:', err);
    }
  }
  console.log('Done!');
}

run();
