/* eslint-disable react-hooks/purity */
// components/dashboard/chat-view.tsx
"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, Clock, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types/chat";
import { useConversationMessages } from "@/hooks/use-chat-history";

interface ChatViewProps {
    conversationId?: string;
    conversationUser?: {
        name: string;
        avatar?: string;
    };
}

export function ChatView({ conversationId, conversationUser }: ChatViewProps) {
    // ✅ Plus de messages hardcodés — état vide par défaut
    const [optimisticMessages, setOptimisticMessages] = React.useState<Message[]>([]);
    const [inputValue, setInputValue] = React.useState("");
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const localIdsRef = React.useRef<Set<string>>(new Set());

    const { messages: fetchedMessages, loading, error, sendMessage } =
        useConversationMessages(conversationId);

    // ✅ Reset des messages optimistes quand on change de conversation
    React.useEffect(() => {
        setOptimisticMessages([]);
        localIdsRef.current = new Set();
        setInputValue("");
    }, [conversationId]);

    // ✅ Merge : on garde uniquement les messages optimistes qui ne sont pas encore dans fetchedMessages
    const messages = React.useMemo(() => {
        const fetchedIds = new Set((fetchedMessages ?? []).map((m) => m.id));
        const pendingOptimistic = optimisticMessages.filter(
            (m) => !fetchedIds.has(m.id)
        );
        return [...(fetchedMessages ?? []), ...pendingOptimistic].sort(
            (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [fetchedMessages, optimisticMessages]);

    // Scroll to bottom quand les messages changent
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const id = `optimistic-${Date.now()}`;
        localIdsRef.current.add(id);

        const newMessage: Message = {
            id,
            content: inputValue,
            sender_type: "admin",
            created_at: new Date().toISOString(),
        };

        // Ajout optimiste immédiat
        setOptimisticMessages((prev) => [...prev, newMessage]);
        setInputValue("");

        // Envoi réel via le hook (si implémenté)
        sendMessage?.(inputValue);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Pas de conversation sélectionnée
    if (!conversationId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Inbox className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                <p className="text-sm">
                    Select a conversation from the sidebar to start chatting
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={conversationUser?.avatar} />
                        <AvatarFallback className="bg-linear-to-br from-cyan-400 to-purple-600 text-white">
                            {conversationUser?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold">
                            {conversationUser?.name || "Unknown User"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Active conversation · #{conversationId}
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    Open
                </Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6 bg-muted/50 overflow-scroll">
                <div className="space-y-4 max-w-4xl mx-auto">

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Chargement des messages...</span>
                        </div>
                    )}

                    {/* Erreur */}
                    {error && !loading && (
                        <div className="flex items-center justify-center py-12 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Aucun message */}
                    {!loading && !error && messages.length === 0 && (
                        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                            Aucun message dans cette conversation.
                        </div>
                    )}

                    {/* Liste des messages */}
                    {messages.map((message) => {
                        const isUser = message.sender_type === "user";
                        const isBot = message.sender_type === "bot";
                        const isAdmin = message.sender_type === "admin";
                        const isOptimistic = message.id.startsWith("optimistic-");
                        const messageDate = new Date(message.created_at);

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3",
                                    isAdmin && "flex-row-reverse"
                                )}
                            >
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {isBot ? (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                    ) : (
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback
                                                className={cn(
                                                    isAdmin
                                                        ? "bg-gradient-to-br from-green-500 to-teal-600"
                                                        : "bg-gradient-to-br from-cyan-400 to-purple-600",
                                                    "text-white"
                                                )}
                                            >
                                                {isAdmin ? "A" : message.sender_type?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>

                                {/* Bulle */}
                                <div
                                    className={cn(
                                        "flex flex-col gap-1 max-w-[70%]",
                                        isAdmin && "items-end"
                                    )}
                                >
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {isBot && <span className="font-medium">Bot Assistant</span>}
                                        {isUser && <span className="font-medium">User</span>}
                                        {isAdmin && <span className="font-medium">You (Admin)</span>}
                                        <span>
                                            {messageDate.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>

                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2 text-sm",
                                            isBot && "bg-muted",
                                            isUser && "bg-secondary",
                                            isAdmin && "bg-primary text-primary-foreground",
                                            isOptimistic && "opacity-60"
                                        )}
                                    >
                                        {message.content}
                                    </div>

                                    {/* Indicateur envoi en cours */}
                                    {isOptimistic && (
                                        <span className="text-xs text-muted-foreground">Envoi...</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4 bg-background">
                <div className="max-w-4xl mx-auto flex gap-2">
                    <Textarea
                        placeholder="Type your message as admin..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="min-h-[60px] max-h-[120px] resize-none"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || loading}
                        size="icon"
                        className="h-[60px] w-[60px] flex-shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Press Enter to send, Shift + Enter for new line
                </p>
            </div>
        </div>
    );
}