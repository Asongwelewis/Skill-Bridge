import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tulwescncreiuclmfafv.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_4bZC7aRz9WynNik-2yqibg_DfKrBi0i'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
