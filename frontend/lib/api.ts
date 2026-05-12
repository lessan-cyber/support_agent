import { createClient } from "@/utils/supabase/client";
import type {
    AuthChangeEvent,
    AuthError,
    Session,
} from "@supabase/supabase-js";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Internal cache for the session to avoid multiple hangs
let cachedSession: Session | null = null;

type RequestBody =
    | string
    | number
    | boolean
    | null
    | Record<string, unknown>
    | Array<unknown>;

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Robust helper to get the access token
 */
export async function getAccessToken(): Promise<string> {
    const supabase = createClient();

    // 1. Check internal cache first
    if (cachedSession?.access_token) {
        // Basic expiry check (optional, Supabase client handles refreshing)
        return cachedSession.access_token;
    }

    return new Promise((resolve, reject) => {
        // Set a definitive timeout
        const timeout = setTimeout(() => {
            reject(new Error("Auth Session Timeout"));
        }, 5000);

        // 2. Try to get session from onAuthStateChange (more reliable than getSession() during init)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session: Session | null) => {
                if (session) {
                    clearTimeout(timeout);
                    cachedSession = session;
                    subscription.unsubscribe();
                    resolve(session.access_token);
                } else if (event === "SIGNED_OUT") {
                    clearTimeout(timeout);
                    subscription.unsubscribe();
                    reject(new Error("User is signed out"));
                }
            },
        );

        // 3. Simultaneously try getSession() as a fallback
        supabase.auth
            .getSession()
            .then(
                ({
                    data: { session },
                    error,
                }: {
                    data: { session: Session | null };
                    error: AuthError | null;
                }) => {
                    if (session) {
                        clearTimeout(timeout);
                        cachedSession = session;
                        subscription.unsubscribe();
                        resolve(session.access_token);
                    }
                },
            )
            .catch((err: unknown) => {
                throw err;
            });
    });
}

export const api = {
    async get<T>(
        endpoint: string,
        params?: Record<string, string>,
    ): Promise<T> {
        const fullUrl = `${API_BASE_URL}${endpoint}`;

        try {
            const token = await getAccessToken();
            const url = new URL(fullUrl);
            if (params) {
                Object.keys(params).forEach((key) =>
                    url.searchParams.append(key, params[key]),
                );
            }

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                mode: "cors",
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${errorText}`);
            }

            return (await response.json()) as T;
        } catch (err: unknown) {
            throw err;
        }
    },

    async post<T>(endpoint: string, body: RequestBody): Promise<T> {
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        try {
            const token = await getAccessToken();
            const response = await fetch(fullUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                mode: "cors",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.detail || `API Error: ${response.status}`,
                );
            }

            return (await response.json()) as T;
        } catch (err: unknown) {
            throw err;
        }
    },

    async put<T>(endpoint: string, body: RequestBody): Promise<T> {
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        try {
            const token = await getAccessToken();
            const response = await fetch(fullUrl, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                mode: "cors",
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.detail || `API Error: ${response.status}`,
                );
            }
            return (await response.json()) as T;
        } catch (err: unknown) {
            throw err;
        }
    },

    async delete<T>(endpoint: string): Promise<T> {
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        try {
            const token = await getAccessToken();
            const response = await fetch(fullUrl, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                mode: "cors",
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.detail || `API Error: ${response.status}`,
                );
            }
            return (await response.json()) as T;
        } catch (err: unknown) {
            throw err;
        }
    },

};
