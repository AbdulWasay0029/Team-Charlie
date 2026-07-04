const { supabase, isConfigured } = require('./supabaseClient');

const SEED_COUNCILLORS = [
  {
    name: "Sri Ch. Ram Mohan",
    phone: "+919440011200",
    ward: "Ward 112 (Hitech City)",
    password_hash: "councillor112"
  },
  {
    name: "Smt. P. Vijaya Lakshmi",
    phone: "+919440009500",
    ward: "Ward 95 (Khairatabad)",
    password_hash: "councillor95"
  },
  {
    name: "Sri K. Venkatesh",
    phone: "+919440008000",
    ward: "Ward 80 (Charminar)",
    password_hash: "councillor80"
  },
  {
    name: "Sri V. Krishna Mohan",
    phone: "+919440010100",
    ward: "Ward 101 (Jubilee Hills)",
    password_hash: "councillor101"
  },
  {
    name: "Sri M. Satyanarayana",
    phone: "+919440012000",
    ward: "Ward 120 (Kukatpally)",
    password_hash: "councillor120"
  },
  {
    name: "Smt. K. Saritha",
    phone: "+919440008500",
    ward: "Ward 85 (Koti)",
    password_hash: "councillor85"
  }
];

async function seed() {
  console.log('🌱 Starting Councillor Seeding...');
  if (!isConfigured || !supabase) {
    console.log('⚠️ Supabase not configured. Skipping live seeding.');
    return;
  }

  try {
    for (const c of SEED_COUNCILLORS) {
      console.log(`Checking councillor: ${c.name} (${c.ward})...`);
      
      const { data: existing, error: fetchErr } = await supabase
        .from('councillors')
        .select('*')
        .eq('phone', c.phone)
        .maybeSingle();

      if (fetchErr) {
        console.error(`Error querying councillor table:`, fetchErr.message);
        console.log(`Please make sure you have executed the migration script to create the 'councillors' table in your Supabase SQL Editor.`);
        return;
      }

      if (existing) {
        console.log(`ℹ️ Councillor already registered: ${c.name}`);
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('councillors')
          .insert([c])
          .select()
          .single();

        if (insertErr) throw insertErr;
        console.log(`✅ Seeded councillor: ${c.name} for ${c.ward}`);
      }
    }
    console.log('🌱 Councillor Seeding Completed successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  }
}

seed();
