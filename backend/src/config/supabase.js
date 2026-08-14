import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';

if (!config.supabase.url || !config.supabase.key) {
  console.warn('Supabase URL/key not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(config.supabase.url, config.supabase.key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});