"use client";
import { useState, useEffect } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import type { Conversation, Message } from "@/lib/types/chat";
interface LiveConversationProps {
    ticketId?: string;
    onTakeOver?: () => void;
}

export function LiveConversation({
    ticketId,
    onTakeOver,
}: LiveConversationProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [agentTakenOver, setAgentTakenOver] = useState(false);

    useEffect(() => {
        if (!ticketId) return;

        setConversation(null);
        setMessages([]);
        setLoading(true);

        const abortController = new AbortController();

        const fetchConversationMessages = async () => {
            try {
                const supabase = createClient();
                const { data: session } = await supabase.auth.getSession();
                const token = session?.session?.access_token;

                if (!token) throw new Error("No authentication token");

                const BACKEND_BASE_URL =
                    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
                    "http://localhost:8000";

                const response = await fetch(
                    `${BACKEND_BASE_URL}/api/v1/admin/conversations/${encodeURIComponent(ticketId)}/messages`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        signal: abortController.signal,
                    },
                );

                if (!response.ok) throw new Error("Failed to fetch messages");

                const data = await response.json();
                if (abortController.signal.aborted) return;
                setConversation(data);
                setMessages(data.messages || []);
            } catch (err) {
                if (abortController.signal.aborted) return;
                console.error(
                    "[LiveConversation] Error fetching messages:",
                    err,
                );
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchConversationMessages();

        return () => abortController.abort();
    }, [ticketId]);

    const handleTakeover = () => {
        setAgentTakenOver(true);
        onTakeOver?.();
    };
    useEffect(() => {
        setAgentTakenOver(false);
    }, [ticketId]);

    if (!ticketId) {
        return (
            <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Sélectionnez une conversation pour voir les détails
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-0 overflow-hidden flex flex-col h-96">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                    Conversation — {conversation?.userEmail || ticketId}
                </span>
                <button
                    onClick={handleTakeover}
                    disabled={agentTakenOver}
                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                        agentTakenOver
                            ? "bg-green-100 text-green-900 cursor-not-allowed"
                            : "bg-foreground text-background hover:bg-slate-800"
                    }`}
                >
                    {agentTakenOver ? (
                        <>✓ Pris en charge</>
                    ) : (
                        <>
                            Prendre en charge <ArrowRight size={14} />
                        </>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2
                            size={16}
                            className="animate-spin text-muted-foreground"
                        />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">
                            Aucun message
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`text-xs p-3 rounded-lg max-w-xs ${
                                msg.sender_type === "user"
                                    ? "bg-muted text-foreground self-start"
                                    : msg.sender_type === "bot"
                                      ? "bg-blue-100 text-blue-900 self-start"
                                      : "bg-foreground text-background self-end"
                            }`}
                        >
                            <div className="text-xs opacity-70 mb-1 font-semibold capitalize">
                                {msg.sender_type === "admin"
                                    ? "Agent"
                                    : msg.sender_type}
                            </div>
                            <p>{msg.content}</p>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
