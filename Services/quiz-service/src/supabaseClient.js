const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl    = process.env.SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecret) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
}

const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

module.exports = supabase;