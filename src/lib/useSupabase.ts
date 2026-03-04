import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClerkSupabaseClient } from "./supabase";

export function useSupabase() {
    const { getToken } = useAuth();
    const [supabase, setSupabase] = useState<any>(null);

    useEffect(() => {
        const initSupabase = async () => {
            try {
                const token = await getToken({ template: 'supabase' });
                if (token) {
                    setSupabase(createClerkSupabaseClient(token));
                }
            } catch (e) {
                console.error("Error getting clerk token", e);
            }
        };
        initSupabase();
    }, [getToken]);

    return supabase;
}
