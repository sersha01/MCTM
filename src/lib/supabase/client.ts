import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database-types";

let cached: SupabaseClient<Database> | null = null;

/**
 * Browser Supabase client. Uses the anon key only — the
 * service-role key must never reach the browser.
 */
export function getBrowserSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!cached) {
    cached = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
