import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database-types";

/**
 * Server-side Supabase client factory.
 *
 * Uses the service-role key — server only, never imported into
 * client components. Returns null when credentials are missing
 * so callers can surface a DATABASE ● DEGRADED notice instead
 * of crashing.
 */
export function createServerSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
