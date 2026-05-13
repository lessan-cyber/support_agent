// app/dashboard/inbox/layout.tsx
"use client";

import { useState } from "react"
import { InboxSidebar } from "@/components/dashboard/inbox-sidebar"
import { ChatView } from "@/components/dashboard/chat-view"
import { useSearchParams } from "next/dist/client/components/navigation"
import { useRouter } from "next/navigation"

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('conversation') || undefined // "ABC123"
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()
  const router = useRouter()
  
  // Mock data - À remplacer par vos vraies données
  const conversationUsers = {
    "1": { name: "Alice Martin", avatar: undefined },
    "2": { name: "Bob Dupont", avatar: undefined },
    "3": { name: "Claire Bernard", avatar: undefined },
    "4": { name: "David Moreau", avatar: undefined },
  }

  return (
    <div className="flex h-full w-full">
      <InboxSidebar 
        onConversationSelect={(id) => router.push(`/dashboard/inbox?conversation=${id}`)}
        selectedConversationId={selectedId}
      />
      <main className="flex-1 overflow-hidden">
        <ChatView 
          conversationId={selectedId}
          // conversationUser={selectedConversationId ? conversationUsers[selectedConversationId as keyof typeof conversationUsers] : undefined}
        />
      </main>
    </div>
  )
}
