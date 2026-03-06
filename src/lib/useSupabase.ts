import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClerkSupabaseClient } from "./supabase";

export function useSupabase() {
    const { getToken } = useAuth();
    const [supabase, setSupabase] = useState<any>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refreshClient = useCallback(async () => {
        try {
            const token = await getToken({ template: 'supabase' });
            if (token) {
                setSupabase(createClerkSupabaseClient(token));
            }
        } catch (e) {
            console.error("Error getting clerk token", e);
        }
    }, [getToken]);

    useEffect(() => {
        refreshClient();
        // Refresh token every 50 seconds to avoid expiration
        intervalRef.current = setInterval(refreshClient, 50000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [refreshClient]);

    return supabase;
}
