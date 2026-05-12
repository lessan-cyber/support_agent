// app/(protected)/dashboard/inbox/page.tsx
"use client"

import { useSearchParams } from 'next/navigation'
import { MessageComponent } from "@/components/dashboard/message"
import { ChatView } from '@/components/dashboard/chat-view'

export default function InboxPage() {
    const searchParams = useSearchParams()
    const conversationId = searchParams.get('conversation')

    return (
        <div>
            {conversationId
                ? <ChatView conversationId={conversationId} />
                : <p>Sélectionne une conversation</p>
            }
        </div>
    )
}