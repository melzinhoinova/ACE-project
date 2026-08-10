import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Aviso: Variáveis de ambiente do Supabase ausentes no Frontend!");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
