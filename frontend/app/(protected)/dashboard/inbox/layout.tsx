// app/dashboard/inbox/layout.tsx
"use client";

import { useState } from "react";
import { InboxSidebar } from "@/components/dashboard/inbox-sidebar";
import { ChatView } from "@/components/dashboard/chat-view";

import { useRouter, useSearchParams } from "next/navigation";

export default function InboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const searchParams = useSearchParams();
    const selectedId = searchParams.get("conversation") || undefined; // "ABC123"
    const [selectedConversationId, setSelectedConversationId] = useState<
        string | undefined
    >();
    const router = useRouter();

    return (
        <div className="flex h-full w-full">
            <InboxSidebar
                onConversationSelect={(id) =>
                    router.push(`/dashboard/inbox?conversation=${id}`)
                }
                selectedConversationId={selectedId}
            />
            <main className="flex-1 overflow-hidden">
                {selectedId ? (
                    children
                ) : (
                    <div className="p-4 text-sm text-muted-foreground">
                        Select a conversation to view its messages.
                    </div>
                )}
            </main>
        </div>
    );
}
