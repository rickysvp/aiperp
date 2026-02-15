import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('[Supabase] URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('[Supabase] Key:', supabaseAnonKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false
    }
  }
);

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  const configured = !!supabaseUrl && !!supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_url' && 
    supabaseAnonKey !== 'your_supabase_anon_key';
  console.log('[Supabase] isConfigured:', configured);
  return configured;
};
