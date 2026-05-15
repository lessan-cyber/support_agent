// app/dashboard/inbox/page.tsx
"use client"

import { useSearchParams } from 'next/navigation'

export default function InboxPage() {
    const searchParams = useSearchParams()
    const conversationId = searchParams.get('conversation')

    // Le layout gère déjà l'affichage de ChatView.
    // Cette page sert uniquement d'état vide quand aucune conversation n'est sélectionnée.
    if (conversationId) return null

    return (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Sélectionne une conversation
        </div>
    )
}