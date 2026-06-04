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

function getSupabaseDiagnostics() {
  const secretLength = supabaseSecret.length;
  const secretFingerprint = secretLength > 8
    ? `${supabaseSecret.slice(0, 4)}...${supabaseSecret.slice(-4)}`
    : 'redacted';

  return {
    supabaseUrl,
    hasSupabaseSecret: Boolean(supabaseSecret),
    supabaseSecretLength: secretLength,
    supabaseSecretFingerprint: secretFingerprint,
  };
}

module.exports = supabase;
module.exports.getSupabaseDiagnostics = getSupabaseDiagnostics;