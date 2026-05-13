'use client'

import type { Conversation } from '@/lib/types/chat'
import {
  getInitialFromEmail,
  formatConversationTime,
  needsImmediateAttention,
} from '@/lib/utils/dashboard.utils'
import { Badge } from '../ui/badge'
import { Avatar } from '../ui/avatar'

interface TicketItemProps {
  conversation: Conversation
  isHighlighted?: boolean
  onClick?: () => void
}

export function TicketItem({ conversation, isHighlighted = false, onClick }: TicketItemProps) {
  const initial = getInitialFromEmail(conversation.userEmail)
  const hasUrgentAttention = needsImmediateAttention(conversation)
  const formattedTime = formatConversationTime(conversation.lastMessageAt)

  const getStatusColor = () => {
    if (hasUrgentAttention) return 'bg-amber-50 text-amber-900'
    if (conversation.status === 'open') return 'bg-green-50 text-green-900'
    return 'bg-slate-100 text-slate-900'
  }

  const getStatusLabel = () => {
    if (hasUrgentAttention) return 'Humain requis'
    if (conversation.status === 'open') return 'Résolu'
    return 'Escalade'
  }

  const getAvatarColor = () => {
    if (hasUrgentAttention) return 'bg-amber-100 text-amber-900'
    if (conversation.lastMessageSender === 'bot') return 'bg-blue-100 text-blue-900'
    return 'bg-slate-100 text-slate-900'
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-border hover:bg-muted transition-colors cursor-pointer last:border-b-0 ${
        isHighlighted ? 'bg-muted' : ''
      }`}
    >
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <Avatar className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${getAvatarColor()}`}>
          {initial}
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {conversation.userEmail.split('@')[0]}
            </p>
            {hasUrgentAttention && <span className="text-xs font-semibold text-amber-600">● Nouveau</span>}
          </div>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {conversation.lastMessageContent}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">{formattedTime}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{conversation.messageCount} messages</span>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant={hasUrgentAttention ? 'destructive' : conversation.status === 'open' ? 'resolved' : 'outline'}>
          {getStatusLabel()}
        </Badge>
      </div>
    </div>
  )
}
