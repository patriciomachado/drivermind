import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kniqdsfzrfuebwfayaft.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gAgdL76kprbuNbzJz0zS_g_xNFTciMS'
    )
