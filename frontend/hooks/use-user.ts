"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Simple user interface
 */
interface SimpleUser {
    id: string;
    email: string | null;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
}

/**
 * Custom hook to get the current authenticated user.
 * Uses Supabase client directly for real-time updates.
 * @returns {{ user: SimpleUser | null, loading: boolean, profile: Record<string, any> | null }}
 */
export function useUser() {
    const [user, setUser] = useState<SimpleUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        // Récupérer l'utilisateur actuel
        const initUser = async () => {
            try {
                setLoading(true);
                const {
                    data: { user: authUser },
                } = await supabase.auth.getUser();

                if (authUser) {
                    setUser({
                        id: authUser.id,
                        email: authUser.email ?? null,
                        user_metadata: authUser.user_metadata,
                        app_metadata: authUser.app_metadata,
                    });
                    console.log("[useUser] User loaded:", authUser.email);
                } else {
                    setUser(null);
                    console.log("[useUser] No authenticated user");
                }
            } catch (error) {
                console.error("[useUser] Error fetching user:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initUser();

        // S'abonner aux changements d'authentication
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email ?? null,
                    user_metadata: session.user.user_metadata,
                    app_metadata: session.user.app_metadata,
                });
            } else {
                setUser(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    return { user, loading, profile: null as Record<string, any> | null };
}
