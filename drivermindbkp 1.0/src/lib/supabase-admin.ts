
import { createClient } from '@supabase/supabase-js';

// NOTA: Esta chave deve ser mantida APENAS no servidor (API Routes)
// Nunca exponha isso no frontend (client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabaseAdmin = () => {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase Admin Keys');
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
