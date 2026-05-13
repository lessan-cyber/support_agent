
'use client'

import { AlertCircle, Check } from 'lucide-react'
import type { Conversation } from '@/lib/types/chat'
import { Card } from '@/components/ui/card'
import { getHumanEscalationCount } from '@/lib/utils/dashboard.utils'

interface DashboardHeaderProps {
  user?: { email?: string; user_metadata?: { name?: string } }
  conversations?: Conversation[]
  showNotification?: boolean
}

export function DashboardHeader({
  user,
  conversations = [],
  showNotification = false,
}: DashboardHeaderProps) {
  const escalationCount = getHumanEscalationCount(conversations)
  const hasUrgentTickets = escalationCount > 0
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Agent'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <Card className="p-0 rounded-2xl">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center text-white text-[11px] font-semibold">
            {userInitial}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {userName}AI <span className="text-xs text-muted-foreground font-normal">Dashboard</span>
          </span>
        </div>
        {(showNotification || hasUrgentTickets) && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium px-3 py-2 rounded-full">
            {hasUrgentTickets ? (
              <>
                <AlertCircle size={14} />
                <span>{escalationCount} ticket{escalationCount > 1 ? 's' : ''} attendant</span>
              </>
            ) : (
              <>
                <Check size={12} />
                <span>Nouveau ticket — demande humain</span>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
