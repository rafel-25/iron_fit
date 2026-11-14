import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/supabase.js";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);