// app/dashboard/inbox/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { InboxSidebar} from "@/components/dashboard/inbox-sidebar";
import { ChatView } from "@/components/dashboard/chat-view";

export default function InboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Synchronise selectedId à chaque changement d'URL
    const [selectedId, setSelectedId] = useState<string | undefined>(
        searchParams.get("conversation") ?? undefined
    );

    useEffect(() => {
        const conversationId = searchParams.get("conversation") ?? undefined;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedId(conversationId);
    }, [searchParams]);

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <InboxSidebar
                    onConversationSelect={(id) =>
                        router.push(`/dashboard/inbox?conversation=${encodeURIComponent(id)}`)
                    }
                    selectedConversationId={selectedId}
                />
                <main className="flex-1 h-screen overflow-hidden">
                    <ChatView conversationId={selectedId} />
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}