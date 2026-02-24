import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import config from "@/config";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  if (!config.supabaseUrl || !config.supabaseKey) return null;
  client = createClient(config.supabaseUrl, config.supabaseKey);
  return client;
}
