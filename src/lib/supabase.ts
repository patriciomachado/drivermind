import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xlbaixcghujaxlymqecp.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYmFpeGNnaHVqYXhseW1xZWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDQzNDQsImV4cCI6MjA4ODEyMDM0NH0.NItM4N5dusaRRbk4-B84v6vh2kFzN0KBZr3_VM979nY'
    )

export const createClerkSupabaseClient = (clerkToken: string) => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xlbaixcghujaxlymqecp.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYmFpeGNnaHVqYXhseW1xZWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDQzNDQsImV4cCI6MjA4ODEyMDM0NH0.NItM4N5dusaRRbk4-B84v6vh2kFzN0KBZr3_VM979nY',
        {
            global: {
                fetch: async (url, options = {}) => {
                    const headers = new Headers(options?.headers);
                    headers.set('Authorization', `Bearer ${clerkToken}`);

                    return fetch(url, {
                        ...options,
                        headers,
                    });
                },
            },
        }
    )
}
