import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pwqnrdnjgemglpfgetii.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "https://pwqnrdnjgemglpfgetii.supabase.co/rest/v1/";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
