import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let serverSupabaseInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured for server-side operations.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS safely within server actions.
 */
export function getServerSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!serverSupabaseInstance) {
    serverSupabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return serverSupabaseInstance;
}
