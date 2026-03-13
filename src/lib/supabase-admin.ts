
import { createClient } from '@supabase/supabase-js';

// NOTA: Esta chave deve ser mantida APENAS no servidor (API Routes)
// Nunca exponha isso no frontend (client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xlbaixcghujaxlymqecp.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabaseAdmin = () => {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Chaves Administrativas do Supabase ausentes. Verifique SUPABASE_SERVICE_ROLE_KEY no ambiente.');
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
