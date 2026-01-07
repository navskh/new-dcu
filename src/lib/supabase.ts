import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Database generic removed due to type inference issues with Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
