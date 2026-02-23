require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error, count } = await supabase
    .from('daily_reflections')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error("Error querying table:", error);
  } else {
    console.log(`Total daily_reflections: ${count}`);
  }
}

check();
