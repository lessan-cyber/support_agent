// app/dashboard/inbox/layout.tsx
'use client'

import { useState } from "react"
import { InboxSidebar } from "@/components/dashboard/inbox-sidebar"
import { ChatView } from "@/components/dashboard/chat-view"

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()
  
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
        onConversationSelect={setSelectedConversationId}
        selectedConversationId={selectedConversationId}
      />
      <main className="flex-1 overflow-hidden">
        <ChatView 
          conversationId={selectedConversationId}
          conversationUser={selectedConversationId ? conversationUsers[selectedConversationId as keyof typeof conversationUsers] : undefined}
        />
      </main>
    </div>
  )
}