// app/(protected)/dashboard/inbox/[messageId]/page.tsx
"use client";
// get messageId from url params and display it in the page
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { MessageComponent } from "@/components/dashboard/message";
import { ChatView } from "@/components/dashboard/chat-view";

interface MessageData {
    user: { name: string; email: string; avatar: string };
    content: string;
    date: string;
}

export default function Message() {
    const searchParams = useSearchParams();

    const [selectedId, setSelectedId] = useState<string | undefined>(
        searchParams.get("conversation") || undefined
    ); // "ABC123"
    setSelectedId(searchParams.get("conversation") || undefined);
    const { messageId } = useParams<{ messageId: string }>();
    const router = useRouter();
    const [message, setMessage] = useState<MessageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!messageId) {
            router.push("/dashboard/inbox");
            return;
        }
        const controller = new AbortController();
        let active = true;

        const fetchMessage = async () => {
            setMessage(null);
            setLoading(true);
            try {
                const supabase = createClient();
                const { data: session } = await supabase.auth.getSession();
                const token = session?.session?.access_token;
                if (!token) {
                    router.push("/dashboard/inbox");
                    return;
                }

                const response = await fetch(
                    `/api/v1/admin/conversations/${messageId}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        signal: controller.signal,
                    },
                );
                if (!response.ok) throw new Error("Not found");
                const data = await response.json();
                if (!active) return;
                if (data.messages?.length) {
                    const msg = data.messages[0];
                    setMessage({
                        user: {
                            name: msg.sender_name || "Unknown",
                            email: msg.sender_email || "",
                            avatar: "/avatars/01.png",
                        },
                        content: msg.content,
                        date: msg.created_at,
                    });
                } else {
                    router.push("/dashboard/inbox");
                    return;
                }
            } catch {
                if (!active) return;
                router.push("/dashboard/inbox");
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchMessage();
        return () => {
            active = false;
            controller.abort();
        };
    }, [messageId, router]);

    if (loading)
        return (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        );
    if (!message) return null;
    return (
        <div>
            
        </div>
    );
}
