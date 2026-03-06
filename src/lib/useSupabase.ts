import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClerkSupabaseClient } from "./supabase";

export function useSupabase() {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const [supabase, setSupabase] = useState<any>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasAlerted = useRef(false);

    const refreshClient = useCallback(async () => {
        if (!isLoaded || !isSignedIn) {
            return;
        }
        try {
            const token = await getToken({ template: 'supabase' });
            if (token) {
                setSupabase(createClerkSupabaseClient(token));
                hasAlerted.current = false;
            } else if (!hasAlerted.current) {
                hasAlerted.current = true;
                // Try fallback token to diagnose
                const fallbackToken = await getToken();
                alert(
                    `[DEBUG] Token Supabase é null.\n` +
                    `isLoaded: ${isLoaded}\n` +
                    `isSignedIn: ${isSignedIn}\n` +
                    `Token padrão: ${fallbackToken ? 'OK' : 'NULL'}\n\n` +
                    `Verifique se o JWT Template "supabase" existe no Clerk Dashboard.`
                );
            }
        } catch (e: any) {
            if (!hasAlerted.current) {
                hasAlerted.current = true;
                alert(`[DEBUG] Erro ao obter token: ${e.message || e}`);
            }
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
