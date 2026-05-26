const { createClient } = require('@supabase/supabase-js');

const supabaseUrl    = process.env.SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecret) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { persistSession: false }
});

module.exports = supabase;