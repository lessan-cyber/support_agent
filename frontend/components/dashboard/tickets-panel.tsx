'use client'

import { useMemo } from 'react'
import type { Conversation } from '@/lib/types/chat'
import { Card } from '@/components/ui/card'
import { TicketItem } from './ticket-item'
import { getRecentConversations } from '@/lib/utils/dashboard.utils'
import { Badge } from '../ui/badge'

interface TicketsPanelProps {
  conversations: Conversation[]
  selectedTicketId?: string
  onSelectTicket?: (ticketId: string) => void
  limit?: number
  showNewBadge?: boolean
}

export function TicketsPanel({
  conversations,
  selectedTicketId,
  onSelectTicket,
  limit = 10,
  showNewBadge = false,
}: TicketsPanelProps) {
  const recentConversations = useMemo(
    () => getRecentConversations(conversations, limit),
    [conversations, limit]
  )

  if (recentConversations.length === 0) {
    return (
      <Card className="p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Tickets récents</span>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Aucune conversation pour le moment</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Tickets récents</span>
        {showNewBadge && (
          <Badge variant="destructive" className="text-xs font-semibold">
            ● Nouveau
          </Badge>
        )}
      </div>

      <div className="divide-y divide-border">
        {recentConversations.map((conversation) => (
          <TicketItem
            key={conversation.ticketId}
            conversation={conversation}
            isHighlighted={selectedTicketId === conversation.ticketId}
            onClick={() => onSelectTicket?.(conversation.ticketId)}
          />
        ))}
      </div>
    </Card>
  )
}
