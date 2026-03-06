import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClerkSupabaseClient } from "./supabase";

export function useSupabase() {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const [supabase, setSupabase] = useState<any>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refreshClient = useCallback(async () => {
        if (!isLoaded || !isSignedIn) {
            console.log('[useSupabase] Auth not ready yet. isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
            return;
        }
        try {
            const token = await getToken({ template: 'supabase' });
            if (token) {
                setSupabase(createClerkSupabaseClient(token));
            } else {
                console.error('[useSupabase] getToken returned null. Check Clerk JWT template "supabase" exists.');
                // Fallback: try without template
                const fallbackToken = await getToken();
                console.log('[useSupabase] Fallback token (no template):', fallbackToken ? 'OK' : 'NULL');
            }
        } catch (e) {
            console.error("[useSupabase] Error getting clerk token:", e);
        }
    }, [getToken, isSignedIn, isLoaded]);

    useEffect(() => {
        refreshClient();
        intervalRef.current = setInterval(refreshClient, 50000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [refreshClient]);

    return supabase;
}
