import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClerkSupabaseClient } from "./supabase";

export function useSupabase() {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const [supabase, setSupabase] = useState<any>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refreshClient = useCallback(async () => {
        if (!isLoaded || !isSignedIn) return;
        try {
            const token = await getToken({ template: 'supabase' });
            if (token) {
                setSupabase(createClerkSupabaseClient(token));
            }
        } catch (e) {
            console.error("[useSupabase] Error getting token:", e);
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
